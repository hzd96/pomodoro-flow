/** One local day of focus history. */
export interface DayStats {
  sessions: number;
  focusMinutes: number;
}

export interface StatsRecord {
  version: 1;
  /** Keyed by local date (YYYY-MM-DD). */
  days: Record<string, DayStats>;
  /** endsAt of the last completed session credited, so two tabs can't count it twice. */
  lastCredited?: number;
}

export const emptyStats = (): StatsRecord => ({ version: 1, days: {} });

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** The last `n` local days, oldest first, ending today. */
export function lastDays(n: number, today = new Date()): Date[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today);
    d.setHours(12, 0, 0, 0); // noon keeps setDate stable across DST changes
    d.setDate(d.getDate() - (n - 1 - i));
    return d;
  });
}

/** Consecutive days with at least one completed session, ending today (or yesterday if today has none yet). */
export function streak(stats: StatsRecord, today = new Date()): number {
  const d = new Date(today);
  d.setHours(12, 0, 0, 0);
  if (!stats.days[dayKey(d)]?.sessions) d.setDate(d.getDate() - 1);
  let count = 0;
  while (stats.days[dayKey(d)]?.sessions) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

/**
 * Adds focus time to the day it happened on. `completedAt` identifies a finished session; a session
 * already credited (e.g. by another tab) is ignored.
 */
export function addFocus(stats: StatsRecord, minutes: number, at: number, completedAt?: number): StatsRecord {
  if (completedAt !== undefined && stats.lastCredited === completedAt) return stats;
  const k = dayKey(new Date(at));
  const day = stats.days[k] ?? { sessions: 0, focusMinutes: 0 };
  return {
    ...stats,
    days: {
      ...stats.days,
      [k]: {
        sessions: day.sessions + (completedAt !== undefined ? 1 : 0),
        focusMinutes: Math.round((day.focusMinutes + minutes) * 10) / 10,
      },
    },
    lastCredited: completedAt ?? stats.lastCredited,
  };
}
