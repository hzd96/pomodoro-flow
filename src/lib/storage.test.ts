import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, loadState, loadStats, recordFocus, STATE_KEY, STATS_KEY } from './storage';

const store = new Map<string, string>();
globalThis.localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: () => null,
  get length() {
    return store.size;
  },
};

beforeEach(() => store.clear());

describe('loadState', () => {
  it('returns defaults when nothing or garbage is saved', () => {
    expect(loadState().settings).toEqual(DEFAULT_SETTINGS);
    store.set(STATE_KEY, '{not json');
    expect(loadState().settings).toEqual(DEFAULT_SETTINGS);
  });

  it('ignores data from an unknown version', () => {
    store.set(STATE_KEY, JSON.stringify({ version: 2, settings: { workMinutes: 50 } }));
    expect(loadState().settings.workMinutes).toBe(25);
  });

  it('clamps settings and drops wrong types', () => {
    store.set(STATE_KEY, JSON.stringify({ version: 1, settings: { workMinutes: 500, sound: 'yes', theme: 'neon' } }));
    const { settings } = loadState();
    expect(settings.workMinutes).toBe(180);
    expect(settings.sound).toBe(true);
    expect(settings.theme).toBe('classic');
  });

  it('drops a schedule or timer with the wrong shape', () => {
    const schedule = [{ type: 'work', minutes: 25, focusNumber: 1 }];
    store.set(STATE_KEY, JSON.stringify({ version: 1, settings: {}, schedule, timer: { sessionIndex: 9, endsAt: null, remainingSeconds: 60 } }));
    expect(loadState().schedule).toEqual(schedule);
    expect(loadState().timer).toBeUndefined();
    store.set(STATE_KEY, JSON.stringify({ version: 1, settings: {}, schedule: [{ type: 'nap' }] }));
    expect(loadState().schedule).toBeUndefined();
  });
});

describe('recordFocus', () => {
  it('merges with what another tab saved', () => {
    const t = new Date(2026, 4, 1, 10).getTime();
    recordFocus(25, t, t);
    store.set(STATS_KEY, JSON.stringify({ ...loadStats(), lastCredited: 1 })); // another tab's write
    const stats = recordFocus(25, t + 1, t + 1);
    expect(stats.days['2026-05-01']).toEqual({ sessions: 2, focusMinutes: 50 });
  });
});

describe('index.html', () => {
  it('reads the theme from the same storage key', () => {
    expect(readFileSync('index.html', 'utf8')).toContain(`localStorage.getItem('${STATE_KEY}')`);
  });
});

describe('sw.js', () => {
  it('keeps the placeholders the build fills in', () => {
    const sw = readFileSync('public/sw.js', 'utf8');
    expect(sw).toContain("const BUILD_ID = 'dev';");
    expect(sw).toContain('const ASSETS = [];');
  });
});
