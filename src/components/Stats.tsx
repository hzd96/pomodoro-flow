import type { StatsRecord } from '../lib/stats';
import { dayKey, lastDays, streak } from '../lib/stats';
import { formatDuration } from '../lib/format';
import { Icon } from './Icon';

export function Stats({ stats }: { stats: StatsRecord }) {
  const today = stats.days[dayKey()] ?? { sessions: 0, focusMinutes: 0 };
  const week = lastDays(7).map((d) => ({ d, minutes: stats.days[dayKey(d)]?.focusMinutes ?? 0 }));
  const max = Math.max(60, ...week.map((w) => w.minutes));
  const weekMin = week.reduce((a, w) => a + w.minutes, 0);
  const st = streak(stats);

  return (
    <section className="card p-5" aria-labelledby="stats-h">
      <h2 id="stats-h" className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted">Today</h2>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-surface-2/60 p-3">
          <div className="text-2xl font-bold text-work">{today.sessions}</div>
          <div className="text-xs text-muted">sessions</div>
        </div>
        <div className="rounded-xl bg-surface-2/60 p-3">
          <div className="text-2xl font-bold text-short">{formatDuration(today.focusMinutes)}</div>
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
      <ul className="mt-5 flex h-20 items-end gap-2" aria-label={`Last 7 days: ${formatDuration(weekMin)} focused`}>
        {week.map(({ d, minutes }) => (
          <li
            key={dayKey(d)}
            className="flex flex-1 flex-col items-center gap-1"
            title={`${d.toLocaleDateString()} — ${formatDuration(minutes)}`}
            aria-label={`${d.toLocaleDateString([], { weekday: 'long' })}: ${formatDuration(minutes)}`}
          >
            <div
              className="w-full rounded-md bg-primary/80"
              style={{ height: `${Math.max(3, (minutes / max) * 56)}px`, opacity: minutes ? 1 : 0.25 }}
            />
            <span className="text-[10px] text-muted" aria-hidden="true">
              {d.toLocaleDateString([], { weekday: 'narrow' })}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-right text-xs text-muted">Last 7 days: {formatDuration(weekMin)}</p>
    </section>
  );
}
