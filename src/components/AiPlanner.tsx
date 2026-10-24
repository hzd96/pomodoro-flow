import { useEffect, useState } from 'react';
import type { Pomodoro } from '../usePomodoro';
import { AuthError, getAiStatus, suggestTasks } from '../lib/ai';
import { setAccessKey } from '../lib/storage';
import { Icon } from './Icon';

/** Breaks a goal into one task per remaining focus session. Hidden unless the server has a Gemini key. */
export function AiPlanner({ p }: { p: Pomodoro }) {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [goal, setGoal] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getAiStatus().then((s) => setEnabled(s.enabled));
  }, []);

  if (!enabled) return null;

  const upcoming = p.schedule.filter((s, i) => s.type === 'work' && i >= p.run.index);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim() || !upcoming.length) return;
    setBusy(true);
    setError('');
    try {
      const list = await suggestTasks(goal.trim(), upcoming.length, p.settings.workMinutes);
      p.setTasks((t) => {
        const next = { ...t };
        upcoming.forEach((s, i) => list[i] && (next[s.n] = list[i]));
        return next;
      });
      setOpen(false);
      setGoal('');
    } catch (err) {
      if (err instanceof AuthError) {
        const key = prompt('Access key for AI planning:');
        if (key) {
          setAccessKey(key);
          setError('Key saved — try again.');
        } else setError('Access key required.');
      } else setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!open)
    return (
      <button className="btn mb-3 w-full bg-accent/15 text-sm text-accent" onClick={() => setOpen(true)}>
        <Icon name="sparkles" size={18} /> Plan tasks with AI
      </button>
    );

  return (
    <form onSubmit={submit} className="mb-3 rounded-xl bg-surface-2/60 p-3">
      <label htmlFor="goal" className="mb-2 block text-xs text-muted">
        Your goal — split into {upcoming.length} focus task{upcoming.length === 1 ? '' : 's'}
      </label>
      <div className="flex gap-2">
        <input
          id="goal" className="field flex-1" value={goal} onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g. Draft the quarterly report" dir="auto" autoFocus disabled={busy} maxLength={500}
        />
        <button className="btn bg-accent px-3 text-bg disabled:opacity-50" disabled={busy || !goal.trim()}>
          {busy ? '…' : <Icon name="sparkles" size={18} />}
        </button>
        <button type="button" className="btn bg-surface px-3 text-muted" onClick={() => setOpen(false)} aria-label="Close">
          <Icon name="x" size={18} />
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </form>
  );
}
