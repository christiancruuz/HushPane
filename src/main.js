const path = require("node:path");
const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  screen,
} = require("electron");

app.setName("ClearCue");
app.setPath("userData", path.join(app.getPath("appData"), "ClearCue"));

let controllerWindow;
let prompterWindow;
let clickThrough = false;

const state = {
  text: "Welcome to ClearCue.\n\nPaste your script into the control window, position this prompt near your camera, and share only your presentation window or browser tab.\n\nUse the global shortcut to pause or resume while another app is focused.",
  speed: 34,
  fontSize: 44,
  opacity: 82,
  lineHeight: 1.42,
  running: false,
  visible: true,
  mirrored: false,
};

function send(channel, payload) {
  for (const window of [controllerWindow, prompterWindow]) {
    if (window && !window.isDestroyed()) {
      window.webContents.send(channel, payload);
    }
  }
}

function broadcastState() {
  send("prompter:state", { ...state, clickThrough });
}

function createPrompterWindow() {
  const workArea = screen.getPrimaryDisplay().workArea;
  const width = Math.min(980, Math.max(620, workArea.width - 160));

  prompterWindow = new BrowserWindow({
    width,
    height: 300,
    x: Math.round(workArea.x + (workArea.width - width) / 2),
    y: workArea.y + 38,
    minWidth: 460,
    minHeight: 180,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    fullscreenable: false,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  prompterWindow.setAlwaysOnTop(true);
  prompterWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // Windows uses WDA_EXCLUDEFROMCAPTURE. macOS support is best effort only.
  if (process.platform === "win32" || process.platform === "darwin") {
    prompterWindow.setContentProtection(true);
  }

  prompterWindow.setIgnoreMouseEvents(clickThrough, { forward: true });
  prompterWindow.loadFile(path.join(__dirname, "prompter.html"));
  prompterWindow.once("ready-to-show", () => {
    prompterWindow.showInactive();
    broadcastState();
  });

  prompterWindow.on("closed", () => {
    prompterWindow = undefined;
  });
}

function createControllerWindow() {
  controllerWindow = new BrowserWindow({
    width: 520,
    height: 760,
    minWidth: 430,
    minHeight: 600,
    title: "ClearCue Controls",
    backgroundColor: "#0b0d12",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  controllerWindow.setMenuBarVisibility(false);
  controllerWindow.loadFile(path.join(__dirname, "controller.html"));
  controllerWindow.once("ready-to-show", () => {
    controllerWindow.show();
    broadcastState();
  });

  controllerWindow.on("closed", () => {
    controllerWindow = undefined;
    if (prompterWindow && !prompterWindow.isDestroyed()) {
      prompterWindow.close();
    }
  });
}

function registerShortcuts() {
  const shortcuts = [
    ["CommandOrControl+Shift+Space", () => {
      state.running = !state.running;
      broadcastState();
    }],
    ["CommandOrControl+Shift+Up", () => {
      state.speed = Math.min(120, state.speed + 4);
      broadcastState();
    }],
    ["CommandOrControl+Shift+Down", () => {
      state.speed = Math.max(4, state.speed - 4);
      broadcastState();
    }],
    ["CommandOrControl+Shift+R", () => send("prompter:reset")],
    ["CommandOrControl+Shift+H", () => {
      state.visible = !state.visible;
      if (state.visible) prompterWindow?.showInactive();
      else prompterWindow?.hide();
      broadcastState();
    }],
  ];

  for (const [accelerator, callback] of shortcuts) {
    globalShortcut.register(accelerator, callback);
  }
}

ipcMain.on("prompter:update", (_event, patch) => {
  const allowed = [
    "text",
    "speed",
    "fontSize",
    "opacity",
    "lineHeight",
    "running",
    "visible",
    "mirrored",
  ];

  for (const key of allowed) {
    if (Object.hasOwn(patch, key)) state[key] = patch[key];
  }

  if (Object.hasOwn(patch, "visible")) {
    if (state.visible) prompterWindow?.showInactive();
    else prompterWindow?.hide();
  }

  broadcastState();
});

ipcMain.on("prompter:set-click-through", (_event, enabled) => {
  clickThrough = Boolean(enabled);
  prompterWindow?.setIgnoreMouseEvents(clickThrough, { forward: true });
  if (!clickThrough) prompterWindow?.show();
  broadcastState();
});

ipcMain.on("prompter:reset", () => send("prompter:reset"));
ipcMain.on("prompter:request-state", broadcastState);
ipcMain.handle("prompter:platform", () => process.platform);

app.whenReady().then(() => {
  createPrompterWindow();
  createControllerWindow();
  registerShortcuts();

  app.on("activate", () => {
    if (!controllerWindow) createControllerWindow();
    if (!prompterWindow) createPrompterWindow();
  });
});

app.on("will-quit", () => globalShortcut.unregisterAll());
app.on("window-all-closed", () => app.quit());
