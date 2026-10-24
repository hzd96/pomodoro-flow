import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { unlockAudio } from './lib/alerts';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Browsers only allow sound after a user gesture. Unlock it on the first one, so a session restored
// after a reload can still chime when it ends.
for (const type of ['pointerdown', 'keydown'] as const) window.addEventListener(type, unlockAudio, { once: true, capture: true });

// Register the service worker in production only; in development it would serve stale cached files.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
