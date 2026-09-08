#!/bin/zsh

APP_DIR="${0:A:h}"
ELECTRON_BIN="$APP_DIR/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron"

if [[ ! -x "$ELECTRON_BIN" ]]; then
  echo "ClearCue's Electron runtime is missing."
  echo "Install Node.js 22.12 or newer, then run: npm install"
  read -r "?Press Return to close."
  exit 1
fi

exec "$ELECTRON_BIN" "$APP_DIR"
