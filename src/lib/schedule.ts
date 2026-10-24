import type { NumericSetting, Session, Settings } from '../types';

export const LABELS: Record<Session['type'], string> = {
  work: 'Focus',
  short: 'Short break',
  long: 'Long break',
};

/** Allowed range for each numeric setting; shared by the settings form and the storage loader. */
export const SETTING_BOUNDS: Record<NumericSetting, { min: number; max: number }> = {
  workMinutes: { min: 1, max: 180 },
  shortBreakMinutes: { min: 1, max: 60 },
  longBreakMinutes: { min: 1, max: 90 },
  sessionsBeforeLongBreak: { min: 2, max: 10 },
  totalSessions: { min: 1, max: 20 },
};

export const clampSetting = (key: NumericSetting, value: number): number => {
  const { min, max } = SETTING_BOUNDS[key];
  return Math.min(max, Math.max(min, Math.round(value)));
};

/** Builds the plan: each focus session is followed by a break (a long one after every Nth), except the last. */
export function buildSchedule(s: Settings): Session[] {
  const out: Session[] = [];
  for (let n = 1; n <= s.totalSessions; n++) {
    out.push({ type: 'work', minutes: s.workMinutes, focusNumber: n });
    if (n === s.totalSessions) break;
    const long = n % s.sessionsBeforeLongBreak === 0;
    out.push({ type: long ? 'long' : 'short', minutes: long ? s.longBreakMinutes : s.shortBreakMinutes, focusNumber: n });
  }
  return out;
}
