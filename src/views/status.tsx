import type { Status } from '../status.js';

export type NightCounts = Record<string, Record<'ok' | 'retry' | 'fail', number>>;

export function StatusBoard({ status, counts }: { status: Status; counts: NightCounts }) {
  return (
    <>
      <h1>status</h1>
      <table>
        <tbody>
          <tr><th>adapter</th><td>{status.adapter}</td></tr>
          <tr><th>installed</th><td>{status.installed}</td></tr>
          <tr>
            <th>last beat</th>
            <td>{status.lastBeat ? `${status.lastBeat.at} · pid ${status.lastBeat.pid}` : <span class="warn">none</span>}</td>
          </tr>
        </tbody>
      </table>
      <h2>nights on disk</h2>
      {status.nights.length === 0 ? (
        <p class="mute">nothing in runs/</p>
      ) : (
        <ul>
          {status.nights.map((n) => {
            const c = counts[n];
            return (
              <li>
                <a href={`/digest/${n}`}>{n}</a>{' '}
                <span class="mute">
                  ok {c?.ok ?? '—'} · retry {c?.retry ?? '—'} · fail {c?.fail ?? '—'}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
