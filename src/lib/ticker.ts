/** Calls `onTick` every `ms`, from a worker when possible (see ticker.worker.ts). Returns a stop function. */
export function startTicker(ms: number, onTick: () => void): () => void {
  try {
    const worker = new Worker(new URL('./ticker.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = onTick;
    worker.postMessage(ms);
    return () => worker.terminate();
  } catch {
    const id = setInterval(onTick, ms);
    return () => clearInterval(id);
  }
}
