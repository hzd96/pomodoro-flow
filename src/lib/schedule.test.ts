import { describe, expect, it } from 'vitest';
import { buildSchedule, clampSetting } from './schedule';
import { DEFAULT_SETTINGS } from './storage';

describe('buildSchedule', () => {
  it('alternates focus and breaks with a long break every Nth session and no trailing break', () => {
    const plan = buildSchedule({ ...DEFAULT_SETTINGS, totalSessions: 5, sessionsBeforeLongBreak: 2 });
    expect(plan.map((s) => s.type)).toEqual(['work', 'short', 'work', 'long', 'work', 'short', 'work', 'long', 'work']);
    expect(plan.filter((s) => s.type === 'work').map((s) => s.focusNumber)).toEqual([1, 2, 3, 4, 5]);
  });

  it('uses the configured durations', () => {
    const plan = buildSchedule({ ...DEFAULT_SETTINGS, totalSessions: 2, workMinutes: 50, shortBreakMinutes: 10 });
    expect(plan.map((s) => s.minutes)).toEqual([50, 10, 50]);
  });

  it('handles a single session', () => {
    expect(buildSchedule({ ...DEFAULT_SETTINGS, totalSessions: 1 })).toEqual([{ type: 'work', minutes: 25, focusNumber: 1 }]);
  });
});

describe('clampSetting', () => {
  it('clamps and rounds to the allowed range', () => {
    expect(clampSetting('workMinutes', 0)).toBe(1);
    expect(clampSetting('workMinutes', 999)).toBe(180);
    expect(clampSetting('sessionsBeforeLongBreak', 1)).toBe(2);
    expect(clampSetting('totalSessions', 7.6)).toBe(8);
  });
});
