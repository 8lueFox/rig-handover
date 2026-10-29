import { describe, expect, it } from 'vitest';
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
