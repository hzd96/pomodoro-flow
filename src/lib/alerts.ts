import type { SessionType } from '../types';

let ctx: AudioContext | null = null;

/** Creates or resumes the audio context. Call it from a user gesture so browsers allow sound later. */
export function unlockAudio() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    /* no audio support */
  }
}

/** Plays a short chime: falling after a focus session, rising after a break (back to work). */
export function chime(finished: SessionType) {
  if (!ctx) return;
  const notes = finished === 'work' ? [880, 660, 523] : [523, 660, 880];
  notes.forEach((freq, i) => {
    const t = ctx!.currentTime + i * 0.22;
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    osc.connect(gain).connect(ctx!.destination);
    osc.start(t);
    osc.stop(t + 0.65);
  });
}

export async function requestNotifications(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  return (await Notification.requestPermission()) === 'granted';
}

export async function notify(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const opts = { body, icon: '/icons/icon-192.png', tag: 'pomoflow' };
  try {
    // Prefer the service worker: `new Notification()` throws on Android Chrome.
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) return void (await reg.showNotification(title, opts));
    new Notification(title, opts);
  } catch {
    /* notifications unavailable */
  }
}
