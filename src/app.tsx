import { Hono } from 'hono';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig, type RigConfig } from './config.js';
import { readNight, readNightCounted } from './digest/readNight.js';
import type { RunStatus } from './digest/types.js';
import { lane } from './lane.js';
import { readStatus } from './status.js';
import { DigestTable } from './views/digest.js';
import { Layout } from './views/layout.js';
import { StatusBoard, type NightCounts } from './views/status.js';

// Plan section 2c, issue #5: ok / retry / fail per night, by each job's last status.
export function nightCounts(runsDir: string, nights: readonly string[]): NightCounts {
  const counts: NightCounts = {};
  for (const night of nights) {
    const c: Record<RunStatus, number> = { ok: 0, retry: 0, fail: 0 };
    for (const row of readNightCounted(runsDir, night).rows) c[row.lastStatus] += 1;
    counts[night] = c;
  }
  return counts;
}

export function createApp(config: RigConfig = loadConfig()) {
  const app = new Hono();

  app.get('/health', (c) => c.json({ ok: true, lane: lane().id }));

  app.get('/digest/:night', (c) => {
    const night = c.req.param('night');
    if (!existsSync(join(config.runsDir, `${night}.jsonl`))) {
      return c.text('night not found', 404);
    }
    const rows = readNight(config.runsDir, night).sort((a, b) => a.job.localeCompare(b.job));
    return c.html(
      <Layout title={`digest ${night}`} lane={lane()}>
        <DigestTable night={night} rows={rows} />
      </Layout>,
    );
  });

  app.get('/api/digest/:night', (c) => {
    const night = c.req.param('night');
    if (!existsSync(join(config.runsDir, `${night}.jsonl`))) {
      return c.json({ error: 'night not found' }, 404);
    }
    const rows = readNight(config.runsDir, night).sort((a, b) =>
      a.job.localeCompare(b.job),
    );
    return c.json({ night, rows });
  });

  app.get('/', (c) => {
    const status = readStatus(config);
    return c.html(
      <Layout title="status" lane={lane()}>
        <StatusBoard status={status} counts={nightCounts(config.runsDir, status.nights)} />
      </Layout>,
    );
  });

  return app;
}
