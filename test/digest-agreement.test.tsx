import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const config = {
  adapter: 'shim',
  installed: '2026-10-29T14:06:00+01:00',
  beatEverySeconds: 60,
  runsDir: 'runs',
};

// ADR 0001: the page and the JSON are the same digest — same jobs, same order.
describe('digest page and JSON agree', () => {
  it('renders the same jobs in the same order for 2026-10-28', async () => {
    const app = createApp(config);

    const pageRes = await app.request('/digest/2026-10-28');
    expect(pageRes.status).toBe(200);
    const html = await pageRes.text();
    const tbody = html.slice(html.indexOf('<tbody>'), html.indexOf('</tbody>'));
    const pageJobs = [...tbody.matchAll(/<strong>([^<]+)<\/strong>/g)].map((m) => m[1]);

    const jsonRes = await app.request('/api/digest/2026-10-28');
    expect(jsonRes.status).toBe(200);
    const body = (await jsonRes.json()) as { rows: { job: string }[] };
    const jsonJobs = body.rows.map((r) => r.job);

    expect(pageJobs).toEqual(jsonJobs);
  });
});
