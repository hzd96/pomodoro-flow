import { useEffect, useRef } from 'react';
import type { Pomodoro } from '../usePomodoro';
import { fmtMinutes, fmtTime, LABELS } from '../lib/schedule';
import { AiPlanner } from './AiPlanner';
import { Icon } from './Icon';

const DOT = { work: 'bg-work', short: 'bg-short', long: 'bg-long' } as const;

export function Schedule({ p }: { p: Pomodoro }) {
  const { schedule, run, projection, tasks, setTasks } = p;
  const currentRef = useRef<HTMLLIElement>(null);
  const finish = projection[projection.length - 1]?.end;
  const leftMin = schedule.slice(run.index).reduce((a, s) => a + s.minutes, 0);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [run.index]);

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
        {run.index < schedule.length && (
          <span className="text-xs text-muted">
            {fmtMinutes(leftMin)} left · done ≈ <b className="text-fg">{fmtTime(finish)}</b>
          </span>
        )}
      </div>

      <AiPlanner p={p} />

      <ol className="-mr-2 max-h-[60vh] space-y-1.5 overflow-y-auto pr-2">
        {schedule.map((s, i) => {
          const past = i < run.index;
          const isCur = i === run.index;
          const task = s.type === 'work' ? tasks[s.n] : undefined;
          return (
            <li
              key={i}
              ref={isCur ? currentRef : undefined}
              className={`group flex items-start gap-3 rounded-xl px-3 py-2 transition-colors ${
                isCur ? 'bg-surface-2 ring-1 ring-primary/60' : past ? 'opacity-45' : 'hover:bg-surface-2/50'
              }`}
            >
              <button
                className="mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                onClick={() => p.jumpTo(i)}
                title="Jump to this session"
                aria-label={`Jump to ${LABELS[s.type]} ${s.n}`}
              >
                {past ? <Icon name="check" size={14} /> : <span className={`h-2.5 w-2.5 rounded-full ${DOT[s.type]}`} />}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className={s.type === 'work' ? 'font-semibold' : 'text-muted'}>
                    {s.type === 'work' ? `Focus ${s.n}` : LABELS[s.type]} · {s.minutes}m
                  </span>
                  {!past && <span className="font-mono text-xs text-muted">{fmtTime(projection[i].start)}</span>}
                </div>
                {s.type === 'work' && (
                  <>
                    <input
                      className="mt-0.5 w-full truncate bg-transparent text-sm text-fg placeholder:text-muted/60 focus:outline-none"
                      placeholder="What will you work on?"
                      value={task?.title ?? ''}
                      onChange={(e) => setTitle(s.n, e.target.value)}
                      dir="auto"
                      aria-label={`Task for focus ${s.n}`}
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
