import type { Pomodoro } from '../usePomodoro';
import { fmtClock, fmtTime, LABELS } from '../lib/schedule';
import { Icon } from './Icon';

const COLOR = { work: 'text-work', short: 'text-short', long: 'text-long' } as const;
const R = 90;
const CIRC = 2 * Math.PI * R;

function Digital({ progress, active }: { progress: number; active: boolean }) {
  return (
    <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90 overflow-visible">
      <circle cx="100" cy="100" r={R} fill="none" strokeWidth="10" stroke="var(--line)" />
      <circle
        cx="100" cy="100" r={R} fill="none" strokeWidth="10" stroke="currentColor" strokeLinecap="round"
        strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - progress)}
        className={`transition-[stroke-dashoffset] duration-300 ${active ? 'glow' : ''}`}
      />
    </svg>
  );
}

/** Kitchen-timer style: a wedge shows the minutes left on a 60‑minute face. */
function Analog({ seconds }: { seconds: number }) {
  const frac = Math.min(seconds / 3600, 1);
  const a = frac * 2 * Math.PI;
  const r = 78;
  const x = 100 + r * Math.sin(a);
  const y = 100 - r * Math.cos(a);
  return (
    <svg viewBox="0 0 200 200" className="absolute inset-0">
      <circle cx="100" cy="100" r="96" fill="var(--surface-2)" opacity="0.5" />
      {frac >= 0.9999 ? (
        <circle cx="100" cy="100" r={r} fill="currentColor" opacity="0.85" />
      ) : frac > 0 ? (
        <path d={`M100 100 L100 ${100 - r} A${r} ${r} 0 ${frac > 0.5 ? 1 : 0} 1 ${x} ${y} Z`} fill="currentColor" opacity="0.85" />
      ) : null}
      {Array.from({ length: 60 }, (_, i) => (
        <line
          key={i} x1="100" y1={i % 5 ? 8 : 4} x2="100" y2="14"
          stroke="var(--fg)" strokeOpacity={i % 5 ? 0.25 : 0.7} strokeWidth={i % 5 ? 1 : 2}
          transform={`rotate(${i * 6} 100 100)`}
        />
      ))}
      <circle cx="100" cy="100" r="7" fill="var(--fg)" />
    </svg>
  );
}

export function Timer({ p }: { p: Pomodoro }) {
  const { current, remaining, running, done, schedule, run, settings, projection } = p;
  const total = current ? current.minutes * 60 : 1;
  const color = current ? COLOR[current.type] : 'text-muted';
  const workTotal = schedule.filter((s) => s.type === 'work').length;
  const task = current?.type === 'work' ? p.tasks[current.n] : undefined;
  const analog = settings.timerStyle === 'analog';

  return (
    <section className="card flex flex-col items-center p-6 sm:p-8" aria-label="Timer">
      <div className={`mb-1 text-sm font-semibold uppercase tracking-widest ${color}`}>
        {done ? 'Plan complete' : LABELS[current!.type]}
      </div>
      <div className="mb-4 h-5 text-sm text-muted">
        {current && `Session ${current.n} of ${workTotal}`}
        {current && projection[run.index] && (running || !p.pristine) && ` · ends ${fmtTime(projection[run.index].end)}`}
      </div>

      <div className={`relative aspect-square w-full max-w-[18rem] ${color}`}>
        {analog ? <Analog seconds={remaining} /> : <Digital progress={done ? 1 : 1 - remaining / total} active={running} />}
        <div className={`absolute inset-0 flex flex-col items-center justify-center ${analog ? 'pt-[58%]' : ''}`}>
          <div
            className={`font-mono font-black tabular-nums text-fg ${analog ? 'rounded-lg bg-bg/70 px-2 text-3xl' : 'text-6xl sm:text-7xl'}`}
            role="timer" aria-live="off"
          >
            {done ? '🎉' : fmtClock(remaining)}
          </div>
        </div>
      </div>

      {task && (
        <p className="mt-4 max-w-sm text-center text-base font-medium" dir="auto">
          {task.title}
        </p>
      )}

      <div className="mt-6 flex w-full max-w-sm items-center justify-center gap-3">
        <button
          className="btn h-12 w-12 bg-surface-2 p-0 text-fg" onClick={() => p.reset()}
          title="Reset plan (R)" aria-label="Reset plan"
        >
          <Icon name="reset" />
        </button>
        {running ? (
          <button className="btn h-14 flex-1 bg-fg text-lg text-bg" onClick={p.pause} title="Pause (Space)">
            <Icon name="pause" /> Pause
          </button>
        ) : (
          <button className="btn h-14 flex-1 bg-primary text-lg text-bg" onClick={p.start} title="Start (Space)">
            <Icon name="play" /> {done ? 'New plan' : p.pristine ? 'Start' : 'Resume'}
          </button>
        )}
        <button
          className="btn h-12 w-12 bg-surface-2 p-0 text-fg disabled:opacity-40" onClick={p.skip} disabled={done}
          title="Skip to next (N)" aria-label="Skip to next session"
        >
          <Icon name="skip" />
        </button>
      </div>
    </section>
  );
}
