import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Run, Session, Settings, Tasks } from './types';
import { buildSchedule, fmtClock, LABELS } from './lib/schedule';
import { loadState, loadStats, recordFocus, saveState } from './lib/storage';
import { chime, notify, unlockAudio } from './lib/alerts';

const freshRun = (schedule: Session[]): Run => ({ index: 0, endsAt: null, remaining: schedule[0].minutes * 60 });

export function usePomodoro() {
  const [initial] = useState(loadState);
  const [settings, setSettings] = useState<Settings>(initial.settings);
  const [schedule, setSchedule] = useState<Session[]>(() =>
    initial.schedule?.length ? initial.schedule : buildSchedule(initial.settings),
  );
  const [run, setRun] = useState<Run>(() => initial.run ?? freshRun(schedule));
  const [tasks, setTasks] = useState<Tasks>(initial.tasks ?? {});
  const [stats, setStats] = useState(loadStats);
  const [now, setNow] = useState(Date.now);

  const running = run.endsAt !== null;
  const done = run.index >= schedule.length;
  const current = done ? null : schedule[run.index];
  const remaining = running ? Math.max(0, Math.ceil((run.endsAt! - now) / 1000)) : run.remaining;
  // The plan counts as "untouched" until the first session has been started.
  const pristine = run.index === 0 && !running && run.remaining === schedule[0].minutes * 60;

  useEffect(() => saveState({ settings, schedule, run, tasks }), [settings, schedule, run, tasks]);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
  }, [settings.theme]);

  // Time is derived from endsAt, so throttled background tabs stay accurate. While paused a slow
  // tick is enough to keep the projected schedule times current.
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), running ? 250 : 15000);
    return () => clearInterval(id);
  }, [running]);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const runRef = useRef(run);
  runRef.current = run;

  const commitRun = useCallback((r: Run) => {
    runRef.current = r; // visible immediately, so a second tick can't advance twice
    setRun(r);
  }, []);

  /** Leaves the current session. `natural` means its timer ran out (vs. skipped). */
  const advance = useCallback(
    (natural: boolean) => {
      const r = runRef.current;
      const s = settingsRef.current;
      const cur = schedule[r.index];
      if (!cur) return;
      if (cur.type === 'work') {
        const leftSec = r.endsAt !== null ? Math.max(0, (r.endsAt - Date.now()) / 1000) : r.remaining;
        const focused = natural ? cur.minutes : (cur.minutes * 60 - leftSec) / 60;
        if (natural || focused >= 1) setStats(recordFocus(focused, natural));
      }
      const i = r.index + 1;
      const next = schedule[i];
      if (natural) {
        if (s.sound) chime(cur.type);
        if (s.notifications)
          void notify(
            cur.type === 'work' ? 'Focus session done 🎉' : 'Break is over',
            next ? `Next: ${LABELS[next.type]} · ${next.minutes} min` : 'Plan complete — great work!',
          );
      }
      if (!next) return commitRun({ index: schedule.length, endsAt: null, remaining: 0 });
      const secs = next.minutes * 60;
      commitRun({ index: i, endsAt: natural && s.autoStart ? Date.now() + secs * 1000 : null, remaining: secs });
    },
    [schedule, commitRun],
  );

  useEffect(() => {
    if (run.endsAt !== null && now >= run.endsAt) advance(true);
  }, [now, run.endsAt, advance]);

  const reset = useCallback((s: Settings = settingsRef.current) => {
    const sched = buildSchedule(s);
    setSchedule(sched);
    commitRun(freshRun(sched));
  }, [commitRun]);

  const start = useCallback(() => {
    unlockAudio();
    if (done) {
      const sched = buildSchedule(settingsRef.current);
      setSchedule(sched);
      return commitRun({ index: 0, endsAt: Date.now() + sched[0].minutes * 60000, remaining: sched[0].minutes * 60 });
    }
    const r = runRef.current;
    if (r.endsAt === null) commitRun({ ...r, endsAt: Date.now() + r.remaining * 1000 });
  }, [done, commitRun]);

  const pause = useCallback(() => {
    const r = runRef.current;
    if (r.endsAt !== null) commitRun({ ...r, endsAt: null, remaining: Math.max(0, Math.ceil((r.endsAt - Date.now()) / 1000)) });
  }, [commitRun]);

  /** Jump to a session in the plan (paused, full length). */
  const jumpTo = useCallback(
    (i: number) => commitRun({ index: i, endsAt: null, remaining: schedule[i].minutes * 60 }),
    [schedule, commitRun],
  );

  /** Updates settings; a plan that hasn't started yet is rebuilt right away. */
  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      const next = { ...settingsRef.current, ...patch };
      setSettings(next);
      if (pristine) reset(next);
    },
    [pristine, reset],
  );

  // Keep the screen on while a session runs, if enabled.
  useEffect(() => {
    if (!settings.keepAwake || !running || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    const acquire = () => {
      if (document.visibilityState === 'visible')
        navigator.wakeLock.request('screen').then((l) => (lock = l), () => {});
    };
    acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => {
      document.removeEventListener('visibilitychange', acquire);
      void lock?.release();
    };
  }, [settings.keepAwake, running]);

  useEffect(() => {
    document.title = current && (running || !pristine) ? `${fmtClock(remaining)} · ${LABELS[current.type]}` : 'Pomodoro Flow';
  }, [current, remaining, running, pristine]);

  /** Projected start/end (epoch ms) for the current and upcoming sessions. */
  const projection = useMemo(() => {
    const out: { start: number; end: number }[] = [];
    let t = now;
    schedule.forEach((s, i) => {
      if (i < run.index) return out.push({ start: 0, end: 0 });
      const end = i === run.index ? (run.endsAt ?? now + run.remaining * 1000) : t + s.minutes * 60000;
      out.push({ start: i === run.index ? now : t, end });
      t = end;
    });
    return out;
  }, [schedule, run, now]);

  return {
    settings, schedule, run, tasks, stats, current, remaining, running, done, pristine, projection, now,
    start, pause, reset, jumpTo, setTasks, updateSettings,
    skip: () => advance(false),
  };
}

export type Pomodoro = ReturnType<typeof usePomodoro>;
