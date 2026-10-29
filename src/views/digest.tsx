import type { DigestRow } from '../digest/types.js';

// Plan section 2a, issue #3. One table, sorted by job. Retries of 3 or more and any
// fail are marked with the warn class; missing data renders as `—`, never empty.

function dash(value: string | null): string {
  return value ?? '—';
}

function marked(row: DigestRow): boolean {
  return row.retries >= 3 || row.lastStatus === 'fail';
}

export function DigestTable({ night, rows }: { night: string; rows: DigestRow[] }) {
  return (
    <>
      <h1>digest · {night}</h1>
      {rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th>
              <th>owner</th>
              <th>runs</th>
              <th>retries</th>
              <th>last status</th>
              <th>last error</th>
              <th>first at</th>
              <th>last at</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr>
                <td class={marked(row) ? 'warn' : undefined}>
                  <strong>{row.job}</strong>
                </td>
                <td>{dash(row.owner)}</td>
                <td>{row.runs}</td>
                <td class={marked(row) ? 'warn' : undefined}>{row.retries}</td>
                <td class={marked(row) ? 'warn' : undefined}>{row.lastStatus}</td>
                <td>{dash(row.lastError)}</td>
                <td>{row.firstAt}</td>
                <td>{row.lastAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
