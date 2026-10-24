// Posts a tick at the requested interval. Timers in a dedicated worker aren't subject to the heavy
// throttling browsers apply to hidden tabs, so session-end alerts fire on time.
let id: ReturnType<typeof setInterval> | undefined;

self.onmessage = (e: MessageEvent<number>) => {
  clearInterval(id);
  id = setInterval(() => self.postMessage(0), e.data);
};
