// Accurate timer worker using endTimestamp and periodic recalculation to avoid drift.
let timerId = null;
let endTimestamp = null;

self.onmessage = (e) => {
  const { command, seconds } = e.data || {};
  if (command === 'start') {
    if (timerId) clearInterval(timerId);
    const now = Date.now();
    endTimestamp = now + (seconds * 1000);
    postTick();
    timerId = setInterval(() => {
      postTick();
      if (Date.now() > (endTimestamp + 2000)) {
        clearInterval(timerId);
        timerId = null;
      }
    }, 500);
  } else if (command === 'stop') {
    if (timerId) clearInterval(timerId);
    timerId = null;
    endTimestamp = null;
  } else if (command === 'setEnd') {
    endTimestamp = seconds;
  }
};

function postTick() {
  if (!endTimestamp) {
    postMessage({ type: 'tick', seconds: -1 });
    return;
  }
  const sLeft = Math.round((endTimestamp - Date.now()) / 1000);
  postMessage({ type: 'tick', seconds: sLeft });
  if (sLeft < 0 && timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}
