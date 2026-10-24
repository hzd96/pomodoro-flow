import { describe, expect, it } from 'vitest';
import { formatCountdown, formatDuration } from './format';

describe('formatCountdown', () => {
  it('shows MM:SS under an hour', () => {
    expect(formatCountdown(0)).toBe('00:00');
    expect(formatCountdown(25 * 60)).toBe('25:00');
    expect(formatCountdown(59 * 60 + 59)).toBe('59:59');
  });

  it('shows H:MM:SS from an hour', () => {
    expect(formatCountdown(3600)).toBe('1:00:00');
    expect(formatCountdown(90 * 60)).toBe('1:30:00');
  });

  it('clamps negative values to zero', () => {
    expect(formatCountdown(-5)).toBe('00:00');
  });
});

describe('formatDuration', () => {
  it('formats minutes and hours', () => {
    expect(formatDuration(0)).toBe('0m');
    expect(formatDuration(45)).toBe('45m');
    expect(formatDuration(65)).toBe('1h 5m');
  });

  it('never shows 60m (regression)', () => {
    expect(formatDuration(59.6)).toBe('1h 0m');
    expect(formatDuration(119.6)).toBe('2h 0m');
  });
});
