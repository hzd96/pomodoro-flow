import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Session, Settings, Tasks, TimerState } from './types';
import { buildSchedule, LABELS } from './lib/schedule';
import { formatCountdown } from './lib/format';
import { loadState, loadStats, recordFocus, saveState, STATE_KEY, STATS_KEY } from './lib/storage';
import { chime, notify } from './lib/alerts';
import { startTicker } from './lib/ticker';

/** If an auto-started session is noticed this late, it starts from now instead of the previous end. */
const MAX_CHAIN_LATENESS_MS = 2 * 60 * 1000;

const freshTimer = (schedule: Session[]): TimerState => ({
  sessionIndex: 0,
  endsAt: null,
  remainingSeconds: (schedule[0]?.minutes ?? 0) * 60,
});

export function usePomodoro() {
  const [initial] = useState(loadState);
  const [settings, setSettings] = useState<Settings>(initial.settings);
  const [schedule, setSchedule] = useState<Session[]>(() => initial.schedule ?? buildSchedule(initial.settings));
  const [timer, setTimer] = useState<TimerState>(() => initial.timer ?? freshTimer(schedule));
  const [tasks, setTasks] = useState<Tasks>(initial.tasks ?? {});
  const [stats, setStats] = useState(loadStats);
  const [now, setNow] = useState(Date.now);

  const running = timer.endsAt !== null;
  const done = timer.sessionIndex >= schedule.length;
  const current = schedule[timer.sessionIndex] ?? null;
  const remaining = timer.endsAt !== null ? Math.max(0, Math.ceil((timer.endsAt - now) / 1000)) : timer.remainingSeconds;
  // The plan is "pristine" until it is started or the user moves past its first session (skip or
  // jump). While pristine, settings changes rebuild it right away.
  const pristine = timer.sessionIndex === 0 && !running && timer.remainingSeconds === (schedule[0]?.minutes ?? 0) * 60;

  useEffect(() => saveState({ version: 1, settings, schedule, timer, tasks }), [settings, schedule, timer, tasks]);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
  }, [settings.theme]);

  // Time is derived from endsAt, so throttling can't make the countdown drift. While paused, a slow
  // tick is enough to keep the projected schedule times current.
  useEffect(() => {
    setNow(Date.now());
    return startTicker(running ? 250 : 15000, () => setNow(Date.now()));
  }, [running]);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const timerRef = useRef(timer);
  timerRef.current = timer;

  const commitTimer = useCallback((t: TimerState) => {
    timerRef.current = t; // visible immediately, so a second tick can't finish the same session twice
    setTimer(t);
  }, []);

  /** Credits the focus minutes spent so far (if at least one) when leaving a focus session early. */
  const creditPartial = useCallback(
    (t: TimerState) => {
      const cur = schedule[t.sessionIndex];
      if (cur?.type !== 'work') return;
      const leftSec = t.endsAt !== null ? Math.max(0, (t.endsAt - Date.now()) / 1000) : t.remainingSeconds;
      const focused = (cur.minutes * 60 - leftSec) / 60;
      if (focused >= 1) setStats(recordFocus(focused, Date.now()));
    },
    [schedule],
  );

  /** Ends the current session because its timer ran out. */
  const finish = useCallback(() => {
    const t = timerRef.current;
    const s = settingsRef.current;
    if (t.endsAt === null || Date.now() < t.endsAt) return;
    const cur = schedule[t.sessionIndex];
    if (!cur) return;
    if (cur.type === 'work') setStats(recordFocus(cur.minutes, t.endsAt, t.endsAt));
    const i = t.sessionIndex + 1;
    const next = schedule[i];
    if (s.sound) chime(cur.type);
    if (s.notifications)
      void notify(
        cur.type === 'work' ? 'Focus session complete 🎉' : 'Break is over',
        next ? `Next: ${LABELS[next.type]} · ${next.minutes} min` : 'Plan complete — great work!',
      );
    if (!next) return commitTimer({ sessionIndex: schedule.length, endsAt: null, remainingSeconds: 0 });
    const secs = next.minutes * 60;
    if (!s.autoStart) return commitTimer({ sessionIndex: i, endsAt: null, remainingSeconds: secs });
    // Chain from the previous end so a slightly late tick doesn't push the whole plan back.
    const startAt = Date.now() - t.endsAt < MAX_CHAIN_LATENESS_MS ? t.endsAt : Date.now();
    commitTimer({ sessionIndex: i, endsAt: startAt + secs * 1000, remainingSeconds: secs });
  }, [schedule, commitTimer]);

  useEffect(() => {
    if (timer.endsAt !== null && now >= timer.endsAt) finish();
  }, [now, timer.endsAt, finish]);

  /** Moves to a session in the plan, paused and at full length, crediting any focus time spent. */
  const jumpTo = useCallback(
    (i: number) => {
      creditPartial(timerRef.current);
      const target = schedule[i];
      commitTimer(
        target
          ? { sessionIndex: i, endsAt: null, remainingSeconds: target.minutes * 60 }
          : { sessionIndex: schedule.length, endsAt: null, remainingSeconds: 0 },
      );
    },
    [schedule, creditPartial, commitTimer],
  );

  const skip = useCallback(() => jumpTo(timerRef.current.sessionIndex + 1), [jumpTo]);

  /** Rebuilds the plan from settings, crediting any focus time spent in the current session. */
  const reset = useCallback(
    (s: Settings = settingsRef.current) => {
      creditPartial(timerRef.current);
      const sched = buildSchedule(s);
      setSchedule(sched);
      commitTimer(freshTimer(sched));
    },
    [creditPartial, commitTimer],
  );

  /** Reset from a button or shortcut: asks first when a plan is under way. */
  const confirmReset = useCallback(() => {
    if (!pristine && !done && !window.confirm('Reset the plan? Focus time so far stays in your stats.')) return;
    reset();
  }, [pristine, done, reset]);

  const start = useCallback(() => {
    if (done) {
      const sched = buildSchedule(settingsRef.current);
      setSchedule(sched);
      const first = freshTimer(sched);
      return commitTimer({ ...first, endsAt: Date.now() + first.remainingSeconds * 1000 });
    }
    const t = timerRef.current;
    if (t.endsAt === null) commitTimer({ ...t, endsAt: Date.now() + t.remainingSeconds * 1000 });
  }, [done, commitTimer]);

  const pause = useCallback(() => {
    const t = timerRef.current;
    if (t.endsAt !== null)
      commitTimer({ ...t, endsAt: null, remainingSeconds: Math.max(0, Math.ceil((t.endsAt - Date.now()) / 1000)) });
  }, [commitTimer]);

  /** Updates settings; a plan that hasn't started yet is rebuilt right away. */
  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      const next = { ...settingsRef.current, ...patch };
      setSettings(next);
      if (pristine) reset(next);
    },
    [pristine, reset],
  );

  // Follow changes made in another tab or the installed app, so the two don't overwrite each other.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STATS_KEY) setStats(loadStats());
      if (e.key !== STATE_KEY) return;
      const s = loadState();
      setSettings(s.settings);
      if (s.schedule) setSchedule(s.schedule);
      if (s.timer) commitTimer(s.timer);
      setTasks(s.tasks ?? {});
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [commitTimer]);

  // Keep the screen on while a session runs, if enabled. Browsers release the lock when the page is
  // hidden, so it is requested again when the page becomes visible.
  useEffect(() => {
    if (!settings.keepAwake || !running || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let active = true;
    const acquire = () => {
      if (document.visibilityState !== 'visible') return;
      navigator.wakeLock.request('screen').then(
        (l) => (active ? (lock = l) : void l.release()),
        () => {},
      );
    };
    acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', acquire);
      void lock?.release();
    };
  }, [settings.keepAwake, running]);

  useEffect(() => {
    document.title =
      current && (running || !pristine) ? `${formatCountdown(remaining)} · ${LABELS[current.type]}` : 'Pomodoro Flow';
  }, [current, remaining, running, pristine]);

  /** Projected start/end (epoch ms) for each session; past sessions get zeros so indexes match the schedule. */
  const projection = useMemo(() => {
    const out: { start: number; end: number }[] = [];
    let t = now;
    schedule.forEach((s, i) => {
      if (i < timer.sessionIndex) return out.push({ start: 0, end: 0 });
      const isCurrent = i === timer.sessionIndex;
      const end = isCurrent ? (timer.endsAt ?? now + timer.remainingSeconds * 1000) : t + s.minutes * 60000;
      out.push({ start: isCurrent ? now : t, end });
      t = end;
    });
    return out;
  }, [schedule, timer, now]);

  return {
    settings, schedule, timer, tasks, stats, current, remaining, running, done, pristine, projection, now,
    start, pause, skip, reset, confirmReset, jumpTo, setTasks, updateSettings,
  };
}

export type Pomodoro = ReturnType<typeof usePomodoro>;
