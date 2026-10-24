import { forwardRef, useEffect, useState } from 'react';
import type { Pomodoro } from '../usePomodoro';
import type { NumericSetting, Settings, ThemeName } from '../types';
import { requestNotifications } from '../lib/alerts';
import { buildSchedule, SETTING_BOUNDS } from '../lib/schedule';
import { Icon } from './Icon';

const THEMES: { id: ThemeName; label: string; swatch: [string, string] }[] = [
  { id: 'classic', label: 'Classic', swatch: ['#ff6b6b', '#4ecdc4'] },
  { id: 'cyberpunk', label: 'Cyberpunk', swatch: ['#22d3ee', '#d946ef'] },
  { id: 'forest', label: 'Forest', swatch: ['#a3bf68', '#e5874a'] },
  { id: 'ocean', label: 'Ocean', swatch: ['#63d1e4', '#ff8c69'] },
  { id: 'synthwave', label: 'Synthwave', swatch: ['#00d9ff', '#ff00c1'] },
  { id: 'glamour', label: 'Glamour', swatch: ['#ffffff', '#d4af37'] },
  { id: 'light', label: 'Light', swatch: ['#c9353a', '#0d8576'] },
];

const PRESETS = [
  { label: '25 / 5', work: 25, short: 5, long: 15 },
  { label: '50 / 10', work: 50, short: 10, long: 30 },
  { label: '90 / 20', work: 90, short: 20, long: 30 },
];

const NUMBERS: { key: NumericSetting; label: string }[] = [
  { key: 'workMinutes', label: 'Focus (min)' },
  { key: 'shortBreakMinutes', label: 'Short break (min)' },
  { key: 'longBreakMinutes', label: 'Long break (min)' },
  { key: 'sessionsBeforeLongBreak', label: 'Long break every' },
  { key: 'totalSessions', label: 'Focus sessions' },
];

/**
 * A number input that keeps what is typed as a draft and saves it on blur or Enter, so values can be
 * cleared and retyped (e.g. "10" when the minimum is 2). Out-of-range drafts are flagged, not saved.
 */
function NumberField({ label, value, min, max, onCommit }: {
  label: string; value: number; min: number; max: number; onCommit: (v: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const n = Number(draft);
  const valid = draft.trim() !== '' && Number.isInteger(n) && n >= min && n <= max;
  const commit = () => (valid ? n !== value && onCommit(n) : setDraft(String(value)));
  return (
    <label className="text-xs text-muted">
      {label}
      <input
        type="number" inputMode="numeric" className="field mt-1 text-base aria-invalid:border-danger"
        min={min} max={max} step={1} value={draft} aria-invalid={!valid}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
      />
      {!valid && <span className="mt-1 block text-[11px] text-danger">{min}–{max}</span>}
    </label>
  );
}

type BoolKey = 'autoStart' | 'sound' | 'notifications' | 'keepAwake';
const TOGGLES: { key: BoolKey; label: string; hint: string }[] = [
  { key: 'autoStart', label: 'Auto-start next', hint: 'Start the next session automatically' },
  { key: 'sound', label: 'Sound', hint: 'Chime when a session ends' },
  { key: 'notifications', label: 'Notifications', hint: 'Show a system notification when a session ends' },
  { key: 'keepAwake', label: 'Keep screen on', hint: 'While a session is running' },
];

export const SettingsDialog = forwardRef<HTMLDialogElement, { p: Pomodoro }>(function SettingsDialog({ p }, ref) {
  const { settings: s, updateSettings, pristine } = p;
  const durationsChanged = !pristine && JSON.stringify(p.schedule) !== JSON.stringify(buildSchedule(s));

  const toggle = async (key: BoolKey) => {
    if (key === 'notifications' && !s.notifications && !(await requestNotifications())) {
      alert('Notifications are blocked or unsupported. If blocked, allow them for this site in your browser settings.');
      return;
    }
    updateSettings({ [key]: !s[key] } as Partial<Settings>);
  };

  return (
    <dialog
      ref={ref}
      className="card m-auto w-[min(32rem,calc(100vw-2rem))] p-0 text-fg backdrop:bg-black/50"
      onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
      aria-labelledby="settings-h"
    >
      <div className="max-h-[85dvh] overflow-y-auto p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="settings-h" className="text-lg font-bold">Settings</h2>
          <form method="dialog">
            <button className="btn bg-surface-2 p-2 text-muted" aria-label="Close settings">
              <Icon name="x" />
            </button>
          </form>
        </div>

        <div className="mb-3 flex gap-2">
          {PRESETS.map((pr) => (
            <button
              key={pr.label}
              className={`btn flex-1 py-2 text-sm ${s.workMinutes === pr.work && s.shortBreakMinutes === pr.short ? 'bg-primary text-bg' : 'bg-surface-2 text-fg'}`}
              onClick={() => updateSettings({ workMinutes: pr.work, shortBreakMinutes: pr.short, longBreakMinutes: pr.long })}
            >
              {pr.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {NUMBERS.map((n) => (
            <NumberField
              key={n.key} label={n.label} value={s[n.key]} {...SETTING_BOUNDS[n.key]}
              onCommit={(v) => updateSettings({ [n.key]: v } as Partial<Settings>)}
            />
          ))}
        </div>

        {durationsChanged && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-primary/10 p-3 text-xs">
            <span>Duration and session changes apply to the next plan.</span>
            <button className="btn shrink-0 bg-primary px-3 py-1.5 text-xs text-bg" onClick={() => p.reset()}>
              Restart plan now
            </button>
          </div>
        )}

        <div className="mt-5 space-y-1">
          {TOGGLES.map((t) => (
            <button
              key={t.key} role="switch" aria-checked={s[t.key]} onClick={() => toggle(t.key)}
              className="flex w-full items-center justify-between gap-4 rounded-xl px-2 py-2 text-left hover:bg-surface-2/60"
            >
              <span>
                <span className="block text-sm font-medium">{t.label}</span>
                <span className="block text-xs text-muted">{t.hint}</span>
              </span>
              <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${s[t.key] ? 'bg-primary' : 'bg-surface-2 ring-1 ring-inset ring-muted/60'}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full shadow ${s[t.key] ? 'bg-white' : 'bg-muted'} transition-[left] ${s[t.key] ? 'left-[1.375rem]' : 'left-0.5'}`} />
              </span>
            </button>
          ))}
        </div>

        <div className="mt-5">
          <div className="mb-2 text-xs text-muted">Timer style</div>
          <div className="grid grid-cols-2 gap-2">
            {(['digital', 'analog'] as const).map((st) => (
              <button
                key={st}
                className={`btn py-2 text-sm capitalize ${s.timerStyle === st ? 'bg-primary text-bg' : 'bg-surface-2 text-fg'}`}
                onClick={() => updateSettings({ timerStyle: st })}
                aria-pressed={s.timerStyle === st}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 text-xs text-muted">Theme</div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {THEMES.map((t) => (
              <button
                key={t.id} title={t.label} aria-label={`${t.label} theme`} aria-pressed={s.theme === t.id}
                onClick={() => updateSettings({ theme: t.id })}
                className={`flex flex-col items-center gap-1 rounded-xl p-2 text-[10px] ${s.theme === t.id ? 'bg-surface-2 ring-2 ring-primary' : 'hover:bg-surface-2/60'}`}
              >
                <span className="h-7 w-7 rounded-full" style={{ background: `linear-gradient(135deg, ${t.swatch[0]} 50%, ${t.swatch[1]} 50%)` }} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Shortcuts: <kbd>Space</kbd> start/pause · <kbd>N</kbd> skip · <kbd>R</kbd> reset · <kbd>S</kbd> settings
        </p>
      </div>
    </dialog>
  );
});
