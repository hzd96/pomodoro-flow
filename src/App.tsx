import { useEffect, useRef } from 'react';
import { usePomodoro } from './usePomodoro';
import { Timer } from './components/Timer';
import { Schedule } from './components/Schedule';
import { Stats } from './components/Stats';
import { SettingsDialog } from './components/SettingsDialog';
import { Icon } from './components/Icon';

export default function App() {
  const p = usePomodoro();
  const dialog = useRef<HTMLDialogElement>(null);
  const openSettings = () => dialog.current?.showModal();

  // Keyboard shortcuts (ignored while typing, while a dialog is open, or with Ctrl, Alt, or Meta held).
  const pRef = useRef(p);
  pRef.current = p;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || dialog.current?.open || el.closest('input, textarea, select')) return;
      const p = pRef.current;
      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          if (p.running) p.pause();
          else p.start();
          break;
        case 'n':
          if (!p.done) p.skip();
          break;
        case 'r':
          p.reset();
          break;
        case 's':
          dialog.current?.showModal();
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
      <header className="mb-5 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-black tracking-tight">
          <img src="/icons/icon.svg" alt="" className="h-8 w-8" />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Pomodoro Flow</span>
        </h1>
        <button className="btn bg-surface-2/80 p-2.5 text-fg" onClick={openSettings} aria-label="Settings" title="Settings (S)">
          <Icon name="settings" />
        </button>
      </header>

      <main className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Timer p={p} />
          <div className="hidden lg:block">
            <Stats stats={p.stats} />
          </div>
        </div>
        <Schedule p={p} />
        <div className="lg:hidden">
          <Stats stats={p.stats} />
        </div>
      </main>

      <SettingsDialog ref={dialog} p={p} />
    </div>
  );
}
