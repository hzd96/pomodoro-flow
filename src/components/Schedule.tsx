import { useEffect, useRef } from 'react';
import type { Pomodoro } from '../usePomodoro';
import { LABELS } from '../lib/schedule';
import { formatDuration, formatTimeOfDay } from '../lib/format';
import { Icon } from './Icon';

const DOT = { work: 'bg-work', short: 'bg-short', long: 'bg-long' } as const;

export function Schedule({ p }: { p: Pomodoro }) {
  const { schedule, timer, projection, tasks, setTasks } = p;
  const index = timer.sessionIndex;
  const listRef = useRef<HTMLOListElement>(null);
  const currentRef = useRef<HTMLLIElement>(null);
  const finish = projection[projection.length - 1]?.end ?? 0;
  const leftMin = schedule.slice(index).reduce((a, s) => a + s.minutes, 0);

  // Keep the current session visible by scrolling the list only. scrollIntoView would also scroll the
  // page, pulling the timer off screen on phones.
  useEffect(() => {
    const list = listRef.current;
    const item = currentRef.current;
    if (!list || !item) return;
    const top = item.offsetTop - list.offsetTop;
    if (top >= list.scrollTop && top + item.offsetHeight <= list.scrollTop + list.clientHeight) return;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    list.scrollTo({ top: top - 8, behavior: smooth ? 'smooth' : 'auto' });
  }, [index]);

  const setTitle = (n: number, title: string) =>
    setTasks((t) => {
      const next = { ...t };
      if (title.trim()) next[n] = { ...t[n], title };
      else delete next[n];
      return next;
    });

  return (
    <section className="card flex flex-col p-5" aria-labelledby="plan-h">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="plan-h" className="text-sm font-semibold uppercase tracking-widest text-muted">Plan</h2>
        {index < schedule.length && (
          <span className="text-xs text-muted">
            {formatDuration(leftMin)} left · done ≈ <b className="text-fg">{formatTimeOfDay(finish)}</b>
          </span>
        )}
      </div>

      <ol ref={listRef} className="relative -mx-1 max-h-[60vh] space-y-1.5 overflow-y-auto p-1">
        {schedule.map((s, i) => {
          const past = i < index;
          const isCur = i === index;
          const task = s.type === 'work' ? tasks[s.focusNumber] : undefined;
          return (
            <li
              key={i}
              ref={isCur ? currentRef : undefined}
              aria-current={isCur ? 'step' : undefined}
              className={`group flex items-start gap-3 rounded-xl px-3 py-2 transition-colors ${
                isCur ? 'bg-surface-2 ring-1 ring-inset ring-primary/60' : past ? 'opacity-45' : 'hover:bg-surface-2/50'
              }`}
            >
              <button
                className="-mx-1.5 -my-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-surface/60"
                onClick={() => p.jumpTo(i)}
                title="Jump to this session"
                aria-label={`Jump to ${LABELS[s.type]} ${s.focusNumber}`}
              >
                {past ? <Icon name="check" size={14} /> : <span className={`h-2.5 w-2.5 rounded-full ${DOT[s.type]}`} />}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className={s.type === 'work' ? 'font-semibold' : 'text-muted'}>
                    {s.type === 'work' ? `Focus ${s.focusNumber}` : LABELS[s.type]} · {s.minutes}m
                  </span>
                  {!past && <span className="font-mono text-xs text-muted">{formatTimeOfDay(projection[i]?.start ?? 0)}</span>}
                </div>
                {s.type === 'work' && (
                  <>
                    <input
                      className="mt-0.5 w-full truncate rounded bg-transparent text-sm text-fg placeholder:text-muted/60 focus:outline-none focus-visible:underline focus-visible:decoration-primary focus-visible:decoration-2 focus-visible:underline-offset-4"
                      placeholder="What will you work on?"
                      value={task?.title ?? ''}
                      onChange={(e) => setTitle(s.focusNumber, e.target.value)}
                      dir="auto"
                      aria-label={`Task for focus ${s.focusNumber}`}
                    />
                    {task?.note && <p className="text-xs text-muted" dir="auto">{task.note}</p>}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {Object.keys(tasks).length > 0 && (
        <button className="mt-3 self-end text-xs text-muted hover:text-danger" onClick={() => setTasks({})}>
          Clear tasks
        </button>
      )}
    </section>
  );
}
