// Plan section 2, issue #1. The night's log lines are JSON objects:
// { at, job, status, owner, error? } — one per line in runs/<night>.jsonl.
// Times keep the offset from the log, as ISO strings, never converted (styleguide).

export type RunStatus = 'ok' | 'retry' | 'fail';

export type LogLine = {
  at: string;
  job: string;
  status: RunStatus;
  owner: string | null;
  error?: string;
};

// One aggregated row per job: counts, last-seen status and error, first and last time.
export type DigestRow = {
  job: string;
  owner: string | null;
  runs: number;
  retries: number;
  lastStatus: RunStatus;
  lastError: string | null;
  firstAt: string;
  lastAt: string;
};

// Implemented in a later issue; declared here so section 2 can build against it.
export declare function readNight(runsDir: string, night: string): DigestRow[];
