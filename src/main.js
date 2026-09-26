const path = require("node:path");
const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  screen,
  shell,
} = require("electron");

const SUPPORT_URL = "https://buymeacoffee.com/kihongo";
const EXTERNAL_URLS = new Set([
  SUPPORT_URL,
  "https://www.uni-ke.com/",
  "https://www.uni-ke.com",
]);

app.setName("HushPane");
app.setPath("userData", path.join(app.getPath("appData"), "HushPane"));

let controllerWindow;
let prompterWindow;
let clickThrough = false;
let pinTimer;

const state = {
  text: "Welcome to HushPane.\n\nPaste your script into the control window, position this prompt near your camera, and share only your presentation window or browser tab.\n\nUse the global shortcut to pause or resume while another app is focused.",
  speed: 34,
  fontSize: 44,
  opacity: 82,
  lineHeight: 1.42,
  running: false,
  visible: true,
  mirrored: false,
  theme: "light",
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

function syncControllerChrome() {
  if (!controllerWindow || controllerWindow.isDestroyed()) return;
  controllerWindow.setBackgroundColor(state.theme === "dark" ? "#14161a" : "#c5cad1");
}

function pinPrompterAboveFullscreen() {
  if (!prompterWindow || prompterWindow.isDestroyed() || !state.visible) return;

  // Default always-on-top is "floating", which native fullscreen windows cover.
  // screen-saver is high enough to stack above Keynote, browsers, and similar.
  prompterWindow.setAlwaysOnTop(true, "screen-saver", 1);

  if (process.platform === "darwin" || process.platform === "linux") {
    prompterWindow.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
      skipTransformProcessType: true,
    });
  }

  if (process.platform === "darwin") {
    prompterWindow.setFullScreenable(false);
  }

  prompterWindow.moveTop();
}

function schedulePinPrompter() {
  pinPrompterAboveFullscreen();
  clearTimeout(pinTimer);
  // macOS Space transitions finish after the fullscreen animation.
  pinTimer = setTimeout(pinPrompterAboveFullscreen, 500);
}

function showPrompter() {
  if (!prompterWindow || prompterWindow.isDestroyed()) return;
  prompterWindow.showInactive();
  schedulePinPrompter();
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
    acceptFirstMouse: true,
    ...(process.platform === "darwin" ? { type: "panel" } : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  pinPrompterAboveFullscreen();

  // Windows uses WDA_EXCLUDEFROMCAPTURE. macOS support is best effort only.
  if (process.platform === "win32" || process.platform === "darwin") {
    prompterWindow.setContentProtection(true);
  }

  prompterWindow.setIgnoreMouseEvents(clickThrough, { forward: true });
  prompterWindow.loadFile(path.join(__dirname, "prompter.html"));
  prompterWindow.once("ready-to-show", () => {
    showPrompter();
    broadcastState();
  });

  prompterWindow.on("closed", () => {
    prompterWindow = undefined;
  });
}

function createControllerWindow() {
  controllerWindow = new BrowserWindow({
    width: 520,
    height: 920,
    minWidth: 430,
    minHeight: 680,
    title: "HushPane Controls",
    backgroundColor: "#c5cad1",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  controllerWindow.setMenuBarVisibility(false);
  openSupportLinksExternally(controllerWindow.webContents);
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

function openSupportLinksExternally(contents) {
  contents.setWindowOpenHandler(({ url }) => {
    if (EXTERNAL_URLS.has(url)) shell.openExternal(url);
    return { action: "deny" };
  });

  contents.on("will-navigate", (event, url) => {
    if (!EXTERNAL_URLS.has(url)) return;
    event.preventDefault();
    shell.openExternal(url);
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
      if (state.visible) showPrompter();
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

  if (patch.theme === "light" || patch.theme === "dark") state.theme = patch.theme;
  syncControllerChrome();

  if (Object.hasOwn(patch, "visible")) {
    if (state.visible) showPrompter();
    else prompterWindow?.hide();
  }

  broadcastState();
});

ipcMain.on("prompter:set-click-through", (_event, enabled) => {
  clickThrough = Boolean(enabled);
  prompterWindow?.setIgnoreMouseEvents(clickThrough, { forward: true });
  if (!clickThrough) showPrompter();
  broadcastState();
});

ipcMain.on("prompter:reset", () => send("prompter:reset"));
ipcMain.on("prompter:request-state", broadcastState);
ipcMain.handle("prompter:platform", () => process.platform);

app.whenReady().then(() => {
  createPrompterWindow();
  createControllerWindow();
  registerShortcuts();

  screen.on("display-metrics-changed", schedulePinPrompter);
  app.on("did-resign-active", schedulePinPrompter);
  app.on("browser-window-blur", schedulePinPrompter);

  app.on("activate", () => {
    if (!controllerWindow) createControllerWindow();
    if (!prompterWindow) createPrompterWindow();
    else schedulePinPrompter();
  });
});

app.on("will-quit", () => globalShortcut.unregisterAll());
app.on("window-all-closed", () => app.quit());
