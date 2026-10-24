import type { Session, Settings } from '../types';

/** Builds the plan: each focus session is followed by a break (a long one after every Nth), except the last. */
export function buildSchedule(s: Settings): Session[] {
  const out: Session[] = [];
  for (let n = 1; n <= s.totalSessions; n++) {
    out.push({ type: 'work', minutes: s.workMinutes, n });
    if (n === s.totalSessions) break;
    const long = n % s.sessionsBeforeLongBreak === 0;
    out.push({ type: long ? 'long' : 'short', minutes: long ? s.longBreakMinutes : s.shortBreakMinutes, n });
  }
  return out;
}

export const LABELS: Record<Session['type'], string> = {
  work: 'Focus',
  short: 'Short break',
  long: 'Long break',
};

export function fmtClock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${String(m).padStart(2, '0')}:${ss}`;
}

export function fmtTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function fmtMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}
