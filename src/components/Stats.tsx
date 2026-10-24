import type { Stats as StatsData } from '../lib/storage';
import { dayKey } from '../lib/storage';
import { fmtMinutes } from '../lib/schedule';
import { Icon } from './Icon';

function lastDays(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d;
  });
}

function streak(stats: StatsData) {
  const d = new Date();
  if (!stats[dayKey(d)]?.s) d.setDate(d.getDate() - 1); // Start from yesterday if today has no sessions yet.
  let count = 0;
  while (stats[dayKey(d)]?.s) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

export function Stats({ stats }: { stats: StatsData }) {
  const today = stats[dayKey()] ?? { s: 0, m: 0 };
  const week = lastDays(7).map((d) => ({ d, m: stats[dayKey(d)]?.m ?? 0 }));
  const max = Math.max(60, ...week.map((w) => w.m));
  const weekMin = week.reduce((a, w) => a + w.m, 0);
  const st = streak(stats);

  return (
    <section className="card p-5" aria-labelledby="stats-h">
      <h2 id="stats-h" className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted">Today</h2>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-surface-2/60 p-3">
          <div className="text-2xl font-bold text-work">{today.s}</div>
          <div className="text-xs text-muted">sessions</div>
        </div>
        <div className="rounded-xl bg-surface-2/60 p-3">
          <div className="text-2xl font-bold text-short">{fmtMinutes(today.m)}</div>
          <div className="text-xs text-muted">focused</div>
        </div>
        <div className="rounded-xl bg-surface-2/60 p-3">
          <div className="flex items-center justify-center gap-1 text-2xl font-bold text-long">
            {st}
            <Icon name="flame" size={18} />
          </div>
          <div className="text-xs text-muted">day streak</div>
        </div>
      </div>
      <div className="mt-5 flex h-20 items-end gap-2" aria-label={`Last 7 days: ${fmtMinutes(weekMin)} focused`}>
        {week.map(({ d, m }) => (
          <div key={d.toISOString()} className="flex flex-1 flex-col items-center gap-1" title={`${d.toLocaleDateString()} — ${fmtMinutes(m)}`}>
            <div className="w-full rounded-md bg-primary/80" style={{ height: `${Math.max(3, (m / max) * 56)}px`, opacity: m ? 1 : 0.25 }} />
            <span className="text-[10px] text-muted">{d.toLocaleDateString([], { weekday: 'narrow' })}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-right text-xs text-muted">Last 7 days: {fmtMinutes(weekMin)}</p>
    </section>
  );
}
