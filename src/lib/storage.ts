import type { NumericSetting, Session, Settings, Tasks, ThemeName, TimerState } from '../types';
import { clampSetting, SETTING_BOUNDS } from './schedule';
import { addFocus, emptyStats, type StatsRecord } from './stats';

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

const THEMES: ThemeName[] = ['classic', 'cyberpunk', 'forest', 'ocean', 'synthwave', 'glamour', 'light'];

/** Keep in sync with the inline theme script in index.html (a unit test checks this). */
export const STATE_KEY = 'pomodoro-flow:state';
export const STATS_KEY = 'pomodoro-flow:stats';

export interface SavedState {
  version: 1;
  settings: Settings;
  schedule?: Session[];
  timer?: TimerState;
  tasks?: Tasks;
}

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
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

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Merges saved settings over the defaults, dropping wrong types and clamping numbers to the form's bounds. */
export function sanitizeSettings(raw: unknown): Settings {
  const s: Settings = { ...DEFAULT_SETTINGS };
  if (!isObject(raw)) return s;
  for (const key of Object.keys(SETTING_BOUNDS) as NumericSetting[]) {
    const v = raw[key];
    if (typeof v === 'number' && Number.isFinite(v)) s[key] = clampSetting(key, v);
  }
  for (const key of ['autoStart', 'sound', 'notifications', 'keepAwake'] as const) {
    if (typeof raw[key] === 'boolean') s[key] = raw[key];
  }
  if (raw.timerStyle === 'digital' || raw.timerStyle === 'analog') s.timerStyle = raw.timerStyle;
  if (THEMES.includes(raw.theme as ThemeName)) s.theme = raw.theme as ThemeName;
  return s;
}

const isSession = (v: unknown): v is Session =>
  isObject(v) &&
  (v.type === 'work' || v.type === 'short' || v.type === 'long') &&
  typeof v.minutes === 'number' && v.minutes > 0 &&
  typeof v.focusNumber === 'number';

/** Loads saved state, discarding any part that doesn't have the expected shape. */
export function loadState(): SavedState {
  const raw = read(STATE_KEY);
  if (!isObject(raw) || raw.version !== 1) return { version: 1, settings: DEFAULT_SETTINGS };
  const out: SavedState = { version: 1, settings: sanitizeSettings(raw.settings) };
  if (Array.isArray(raw.schedule) && raw.schedule.length && raw.schedule.every(isSession)) {
    out.schedule = raw.schedule;
    const t = raw.timer;
    if (
      isObject(t) &&
      typeof t.sessionIndex === 'number' && t.sessionIndex >= 0 && t.sessionIndex <= raw.schedule.length &&
      (t.endsAt === null || typeof t.endsAt === 'number') &&
      typeof t.remainingSeconds === 'number' && t.remainingSeconds >= 0
    )
      out.timer = t as unknown as TimerState;
  }
  if (isObject(raw.tasks)) out.tasks = raw.tasks as Tasks;
  return out;
}

export const saveState = (s: SavedState) => write(STATE_KEY, s);

export function loadStats(): StatsRecord {
  const raw = read(STATS_KEY);
  return isObject(raw) && raw.version === 1 && isObject(raw.days) ? (raw as unknown as StatsRecord) : emptyStats();
}

/** Re-reads stats before writing, so another tab's progress isn't overwritten. */
export function recordFocus(minutes: number, at: number, completedAt?: number): StatsRecord {
  const stats = addFocus(loadStats(), minutes, at, completedAt);
  write(STATS_KEY, stats);
  return stats;
}
