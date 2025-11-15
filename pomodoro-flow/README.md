# Pomodoro Flow

This is the Pomodoro Flow PWA and Electron scaffold. Files included:
- index.html
- app.js
- timer-worker.js
- sw.js
- styles.css
- manifest.json
- electron/ (electron main & preload)
- .github workflows skeletons

To create a zip of this project, run the included create_pomodoro_zip.sh script.

To run locally:
1. Serve the directory with a static server:
   npx serve -s . -l 8080
2. Open http://localhost:8080

Electron:
- See electron/main.js and package.json for packaging scripts with electron-builder.
- Add your macOS signing certificate and secrets to CI when ready.

Icons:
- Replace icons/pomodoro-192.svg and icons/pomodoro-512.svg with production assets.
