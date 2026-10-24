import type { Run, Session, Settings, Tasks } from '../types';

export const DEFAULT_SETTINGS: Settings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
  totalSessions: 8,
  autoStart: false,
  sound: true,
  notifications: false,
  keepAwake: false,
  timerStyle: 'digital',
  theme: 'classic',
};

const KEY = 'pomoflow:v1';
const STATS_KEY = 'pomoflow:stats';

export interface Saved {
  settings: Settings;
  schedule?: Session[];
  run?: Run;
  tasks?: Tasks;
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: the app still works for this visit */
  }
}

export function loadState(): Saved {
  const saved = read<Partial<Saved>>(KEY);
  return { ...saved, settings: { ...DEFAULT_SETTINGS, ...saved?.settings } };
}

export const saveState = (s: Saved) => write(KEY, s);

/** Focus history per local day: sessions completed and minutes focused. */
export type Stats = Record<string, { s: number; m: number }>;

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const loadStats = (): Stats => read<Stats>(STATS_KEY) ?? {};

export function recordFocus(minutes: number, completed: boolean): Stats {
  const stats = loadStats();
  const k = dayKey();
  const day = stats[k] ?? { s: 0, m: 0 };
  stats[k] = { s: day.s + (completed ? 1 : 0), m: Math.round((day.m + minutes) * 10) / 10 };
  write(STATS_KEY, stats);
  return stats;
}
