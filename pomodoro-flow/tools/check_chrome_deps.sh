#!/usr/bin/env bash
# Helper to inspect a Chrome/Chromium binary for missing shared libs
# Usage: ./tools/check_chrome_deps.sh /path/to/chrome

set -euo pipefail

BIN_PATH="${1:-}"
if [ -z "$BIN_PATH" ]; then
  echo "Usage: $0 /path/to/chrome"
  exit 2
fi

if [ ! -x "$BIN_PATH" ]; then
  echo "File not found or not executable: $BIN_PATH"
  exit 3
fi

echo "Inspecting: $BIN_PATH"
echo
file "$BIN_PATH"
echo
echo "Running ldd to list shared libraries..."
echo
LDDS_OUTPUT=$(ldd "$BIN_PATH" 2>&1) || LDDS_OUTPUT=$(ldd "$BIN_PATH" 2>&1 || true)
echo "$LDDS_OUTPUT"
echo
echo "Missing libraries (lines containing 'not found'):" 
echo "$LDDS_OUTPUT" | grep -i 'not found' || echo "  (none reported)"
echo
MISSING=$(echo "$LDDS_OUTPUT" | grep -i 'not found' | awk '{print $1}' | sort -u) || true
if [ -z "$MISSING" ]; then
  echo "No missing libraries detected by ldd. If Chrome still fails to run, consider running it directly to capture stderr."
  exit 0
fi

echo "\nMapping missing libs to apt packages (best-effort suggestions):\n"
declare -A MAP
MAP[libatk-1.0.so.0]=libatk1.0-0
MAP[libatk-1.0.so]=libatk1.0-0
MAP[libasound.so.2]=libasound2
MAP[libatk-bridge-2.0.so.0]=libatk-bridge2.0-0
MAP[libcairo.so.2]=libcairo2
MAP[libcups.so.2]=libcups2
MAP[libdbus-1.so.3]=libdbus-1-3
MAP[libexpat.so.1]=libexpat1
MAP[libfontconfig.so.1]=libfontconfig1
MAP[libgconf-2.so.4]=libgconf-2-4
MAP[libgdk_pixbuf-2.0.so.0]=libgdk-pixbuf2.0-0
MAP[libglib-2.0.so.0]=libglib2.0-0
MAP[libgtk-3.so.0]=libgtk-3-0
MAP[libnspr4.so]=libnspr4
MAP[libnss3.so]=libnss3
MAP[libpango-1.0.so.0]=libpango-1.0-0
MAP[libpangocairo-1.0.so.0]=libpangocairo-1.0-0
MAP[libstdc++.so.6]=libstdc++6
MAP[libX11.so.6]=libx11-6
MAP[libX11-xcb.so.1]=libx11-xcb1
MAP[libxcb.so.1]=libxcb1
MAP[libXcomposite.so.1]=libxcomposite1
MAP[libXC.so]=libxcursor1
MAP[libXdamage.so.1]=libxdamage1
MAP[libXext.so.6]=libxext6
MAP[libXfixes.so.3]=libxfixes3
MAP[libXrandr.so.2]=libxrandr2
MAP[libXrender.so.1]=libxrender1
MAP[libXss.so.1]=libxss1
MAP[libXtst.so.6]=libxtst6

PACKAGES=()
for lib in $MISSING; do
  pkg=${MAP[$lib]:-}
  if [ -n "$pkg" ]; then
    PACKAGES+=("$pkg")
    echo "  $lib  -> $pkg"
  else
    echo "  $lib  -> (no mapping found)";
  fi
done

if [ ${#PACKAGES[@]} -gt 0 ]; then
  echo
  echo "You can install suggested packages on Debian/Ubuntu with:" 
  echo "  sudo apt-get update && sudo apt-get install -y ${PACKAGES[*]}"
fi

exit 0
