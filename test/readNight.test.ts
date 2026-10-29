import { describe, expect, it } from 'vitest';
import { readNight, readNightCounted } from '../src/digest/readNight.js';

describe('readNight', () => {
  it('reads the acceptance fixture: 5 jobs, 1 bad line counted', () => {
    const { rows, badLines } = readNightCounted('runs', '2026-10-28');
    expect(badLines).toBe(1);
    expect(rows).toHaveLength(5);
    expect(readNight('runs', '2026-10-28')).toHaveLength(5);
  });

  it('aggregates one row per job with counts, last status/error and first/last time', () => {
    const rows = readNight('runs', '2026-10-28');
    const sync = rows.find((r) => r.job === 'lane/sync');
    expect(sync).toEqual({
      job: 'lane/sync',
      owner: 'rook',
      runs: 8,
      retries: 1,
      lastStatus: 'ok',
      lastError: null,
      firstAt: '2026-10-28T23:00:06+01:00',
      lastAt: '2026-10-29T05:00:04+01:00',
    });

    const fixtures = rows.find((r) => r.job === 'fixtures/refresh');
    expect(fixtures).toMatchObject({ runs: 4, retries: 3, lastStatus: 'ok', lastError: null });

    const backup = rows.find((r) => r.job === 'notes/backup');
    expect(backup).toMatchObject({
      runs: 1,
      retries: 0,
      lastStatus: 'fail',
      lastError: 'quota exceeded',
      firstAt: '2026-10-29T04:00:01+01:00',
      lastAt: '2026-10-29T04:00:01+01:00',
    });
  });

  it('keeps the row when owner is null', () => {
    const render = readNight('runs', '2026-10-28').find((r) => r.job === 'digest/render');
    expect(render).toMatchObject({ owner: null, runs: 1, lastStatus: 'ok' });
  });

  it('keeps the offset from the log, never converting times', () => {
    const rotate = readNight('runs', '2026-10-28').find((r) => r.job === 'rig/rotate-logs');
    expect(rotate?.firstAt).toBe('2026-10-28T23:00:02+01:00');
    expect(rotate?.lastAt).toBe('2026-10-28T23:00:02+01:00');
  });

  it('counts every parsed line as a run: 16 lines minus 1 bad = 15 runs', () => {
    const { rows, badLines } = readNightCounted('runs', '2026-10-28');
    const totalRuns = rows.reduce((sum, r) => sum + r.runs, 0);
    expect(totalRuns).toBe(15);
    expect(badLines).toBe(1);
  });
});
