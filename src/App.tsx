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
  // They match physical keys (e.code), so they also work on non-Latin layouts such as Persian.
  const pRef = useRef(p);
  pRef.current = p;
  useEffect(() => {
    // Whether focus last moved by keyboard (Tab) rather than a click, so Space only presses a button
    // the user tabbed to. (:focus-visible can't tell: Chrome sets it on any key press.)
    let keyboardFocus = false;
    const onPointer = () => (keyboardFocus = false);
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Tab') keyboardFocus = true;
      // The target is usually an element, but can be the document or window for synthetic events.
      const el = e.target instanceof Element ? e.target : document.body;
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || dialog.current?.open) return;
      if (el.closest('input, textarea, select, [contenteditable="true"]')) return;
      const p = pRef.current;
      switch (e.code) {
        case 'Space':
          // Let Space press a button the user tabbed to; after a click it still toggles the timer.
          if (keyboardFocus && el.closest('button, a, summary, [role="switch"]')) return;
          e.preventDefault();
          if (p.running) p.pause();
          else p.start();
          break;
        case 'KeyN':
          if (!p.done) p.skip();
          break;
        case 'KeyR':
          p.confirmReset();
          break;
        case 'KeyS':
          dialog.current?.showModal();
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer, true);
    };
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
