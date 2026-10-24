// A zone with a DST change, so day arithmetic is tested across one.
process.env.TZ = 'America/New_York';

import { describe, expect, it } from 'vitest';
import { addFocus, dayKey, emptyStats, lastDays, streak, type StatsRecord } from './stats';

const at = (iso: string) => new Date(iso).getTime();
const withDays = (...keys: string[]): StatsRecord => ({
  version: 1,
  days: Object.fromEntries(keys.map((k) => [k, { sessions: 1, focusMinutes: 25 }])),
});

describe('dayKey', () => {
  it('uses the local date', () => {
    expect(dayKey(new Date('2026-03-08T03:30:00Z'))).toBe('2026-03-07'); // 22:30 local
  });
});

describe('lastDays', () => {
  it('returns consecutive local days across the spring DST change', () => {
    const days = lastDays(3, new Date('2026-03-09T00:30:00-04:00')).map((d) => dayKey(d));
    expect(days).toEqual(['2026-03-07', '2026-03-08', '2026-03-09']);
  });
});

describe('streak', () => {
  it('counts consecutive days ending today', () => {
    expect(streak(withDays('2026-03-07', '2026-03-08', '2026-03-09'), new Date('2026-03-09T09:00:00-04:00'))).toBe(3);
  });

  it('still counts when today has no sessions yet', () => {
    expect(streak(withDays('2026-03-07', '2026-03-08'), new Date('2026-03-09T09:00:00-04:00'))).toBe(2);
  });

  it('breaks on a missing day', () => {
    expect(streak(withDays('2026-03-06', '2026-03-08'), new Date('2026-03-08T09:00:00-04:00'))).toBe(1);
  });
});

describe('addFocus', () => {
  it('credits the day the session ended on, not when it was noticed', () => {
    const endedAt = at('2026-05-01T23:55:00-04:00');
    const stats = addFocus(emptyStats(), 25, endedAt, endedAt);
    expect(stats.days['2026-05-01']).toEqual({ sessions: 1, focusMinutes: 25 });
  });

  it('counts a completed session once even if credited twice (two tabs)', () => {
    const endedAt = at('2026-05-01T10:00:00-04:00');
    const once = addFocus(emptyStats(), 25, endedAt, endedAt);
    expect(addFocus(once, 25, endedAt, endedAt)).toBe(once);
  });

  it('adds partial focus without counting a session', () => {
    const stats = addFocus(emptyStats(), 12.34, at('2026-05-01T10:00:00-04:00'));
    expect(stats.days['2026-05-01']).toEqual({ sessions: 0, focusMinutes: 12.3 });
  });
});
