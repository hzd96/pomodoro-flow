PWA smoke test (terminal)

This repository includes a headless smoke test using Puppeteer to exercise the Pomodoro Flow web app.

Prerequisites (locally):
- Node.js 18+ and npm installed
- You must run the local static HTTP server from the project root before running the test:

```bash
cd /workspaces/pomodoro-flow/pomodoro-flow
python3 -m http.server 8000 --bind 127.0.0.1
```

Install dev dependency locally:

```bash
cd /workspaces/pomodoro-flow/pomodoro-flow
npm install --save-dev puppeteer
```

Run the smoke test (in a separate terminal while the server is running):

```bash
cd /workspaces/pomodoro-flow/pomodoro-flow
node tools/pwa_smoke_test.js
```

What the script does:
- Opens `http://127.0.0.1:8000`
- Waits for the app to load
- Checks for service worker registration
- If the configuration overlay is open, fills a minimal schedule and submits
- Starts the timer, waits 3 seconds, verifies the timer display changed
- Pauses the timer and reports session info

Exit codes produced by the script:
- `0` - PASS
- `2` - Timer didn't tick after starting
- `3` - Unexpected script error

Notes:
- Puppeteer downloads a Chromium binary as part of install which increases install time and disk usage.
- If you prefer Playwright, adapt the script accordingly.
