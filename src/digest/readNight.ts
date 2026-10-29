import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DigestRow, LogLine, RunStatus } from './types.js';

// Plan section 1, issue #2. Reads runs/<night>.jsonl into one DigestRow per job.
// A line that doesn't parse is counted as bad, never thrown: the night still renders.

const statuses: readonly RunStatus[] = ['ok', 'retry', 'fail'];

export type Night = {
  rows: DigestRow[];
  badLines: number;
};

function parseLine(raw: string): LogLine | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== 'object' || value === null) return null;
  const line = value as Record<string, unknown>;
  if (typeof line.at !== 'string' || typeof line.job !== 'string') return null;
  if (typeof line.owner !== 'string' && line.owner !== null) return null;
  if (typeof line.status !== 'string' || !statuses.includes(line.status as RunStatus)) return null;
  if (line.error !== undefined && typeof line.error !== 'string') return null;
  return {
    at: line.at,
    job: line.job,
    status: line.status as RunStatus,
    owner: line.owner as string | null,
    error: line.error as string | undefined,
  };
}

export function readNightCounted(runsDir: string, night: string): Night {
  let raw = '';
  try {
    raw = readFileSync(join(runsDir, `${night}.jsonl`), 'utf8');
  } catch {
    return { rows: [], badLines: 0 };
  }

  const byJob = new Map<string, DigestRow>();
  let badLines = 0;

  for (const line of raw.split('\n')) {
    if (line.trim() === '') continue;
    const parsed = parseLine(line);
    if (parsed === null) {
      badLines += 1;
      continue;
    }
    const row = byJob.get(parsed.job);
    if (row === undefined) {
      byJob.set(parsed.job, {
        job: parsed.job,
        owner: parsed.owner,
        runs: 1,
        retries: parsed.status === 'retry' ? 1 : 0,
        lastStatus: parsed.status,
        lastError: parsed.error ?? null,
        firstAt: parsed.at,
        lastAt: parsed.at,
      });
    } else {
      row.runs += 1;
      if (parsed.status === 'retry') row.retries += 1;
      row.lastStatus = parsed.status;
      row.lastError = parsed.error ?? null;
      row.lastAt = parsed.at;
      row.owner = parsed.owner;
    }
  }

  return { rows: [...byJob.values()], badLines };
}

export function readNight(runsDir: string, night: string): DigestRow[] {
  return readNightCounted(runsDir, night).rows;
}
