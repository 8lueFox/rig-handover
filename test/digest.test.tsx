import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const config = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir: 'runs' };

describe('digest page', () => {
  it('renders the night sorted by job with marks and kept offsets', async () => {
    const res = await createApp(config).request('/digest/2026-10-28');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('digest · 2026-10-28');
    expect(html.indexOf('digest/render')).toBeLessThan(html.indexOf('fixtures/refresh'));
    expect(html.indexOf('fixtures/refresh')).toBeLessThan(html.indexOf('lane/sync'));
    expect(html).toContain('+01:00');
    expect(html).toContain('class="warn"');
    expect(html).toContain('—');
  });

  it('404s a night with no file', async () => {
    const res = await createApp(config).request('/digest/2020-01-01');
    expect(res.status).toBe(404);
  });
});

describe('digest page: temp runs dir', () => {
  let tempDir: string;
  let tempConfig: typeof config;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
    tempConfig = { ...config, runsDir: tempDir };
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('renders "nothing ran" for an empty night', async () => {
    writeFileSync(join(tempDir, '2026-10-29.jsonl'), '');
    const res = await createApp(tempConfig).request('/digest/2026-10-29');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('nothing ran');
  });

  it('still renders a night with a bad line: good line shown, bad line counted not thrown', async () => {
    writeFileSync(
      join(tempDir, '2026-10-30.jsonl'),
      [
        '{"at":"2026-10-30T23:00:01+01:00","job":"lane/sync","owner":"rook","status":"ok"}',
        'this is not json',
        '{"at":"2026-10-30T23:30:01+01:00","job":"lane/sync","owner":"rook","status":"retry"}',
      ].join('\n') + '\n',
    );
    const res = await createApp(tempConfig).request('/digest/2026-10-30');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('lane/sync');
    expect(html).toContain('2026-10-30T23:30:01+01:00');
  });
});
