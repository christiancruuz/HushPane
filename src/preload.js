const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("clearCue", {
  update: (patch) => ipcRenderer.send("prompter:update", patch),
  reset: () => ipcRenderer.send("prompter:reset"),
  requestState: () => ipcRenderer.send("prompter:request-state"),
  setClickThrough: (enabled) =>
    ipcRenderer.send("prompter:set-click-through", enabled),
  platform: () => ipcRenderer.invoke("prompter:platform"),
  onState: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on("prompter:state", listener);
    return () => ipcRenderer.removeListener("prompter:state", listener);
  },
  onReset: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("prompter:reset", listener);
    return () => ipcRenderer.removeListener("prompter:reset", listener);
  },
});
