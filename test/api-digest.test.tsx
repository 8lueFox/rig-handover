import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const config = {
  adapter: 'shim',
  installed: '2026-10-29T14:06:00+01:00',
  beatEverySeconds: 60,
  runsDir: 'runs',
};

describe('GET /api/digest/:night', () => {
  it('returns the rows sorted by job', async () => {
    const res = await createApp(config).request('/api/digest/2026-10-28');
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      night: string;
      rows: { job: string }[];
    };
    expect(body.night).toBe('2026-10-28');
    const jobs = body.rows.map((r) => r.job);
    expect(jobs).toEqual([...jobs].sort((a, b) => a.localeCompare(b)));
  });

  it('404s a night with no file', async () => {
    const res = await createApp(config).request('/api/digest/2020-01-01');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/digest/:night: temp runs dir', () => {
  let tempDir: string;
  let tempConfig: typeof config;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
    tempConfig = { ...config, runsDir: tempDir };
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns empty rows for an empty night', async () => {
    writeFileSync(join(tempDir, '2026-10-29.jsonl'), '');
    const res = await createApp(tempConfig).request('/api/digest/2026-10-29');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { night: string; rows: unknown[] };
    expect(body.night).toBe('2026-10-29');
    expect(body.rows).toEqual([]);
  });

  it('counts a bad line as no run but keeps the night readable: 2 good lines, bad line skipped', async () => {
    writeFileSync(
      join(tempDir, '2026-10-30.jsonl'),
      [
        '{"at":"2026-10-30T23:00:01+01:00","job":"lane/sync","owner":"rook","status":"ok"}',
        'this is not json',
        '{"at":"2026-10-30T23:30:01+01:00","job":"lane/sync","owner":"rook","status":"retry"}',
      ].join('\n') + '\n',
    );
    const res = await createApp(tempConfig).request('/api/digest/2026-10-30');
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      night: string;
      rows: { job: string; runs: number }[];
    };
    expect(body.rows).toEqual([
      { job: 'lane/sync', owner: 'rook', runs: 2, retries: 1, lastStatus: 'retry', lastError: null, firstAt: '2026-10-30T23:00:01+01:00', lastAt: '2026-10-30T23:30:01+01:00' },
    ]);
  });
});
