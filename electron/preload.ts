import {
  contextBridge,
  ipcRenderer,
  IpcRendererEvent,
} from "electron";

console.log("PRELOAD LOADED");

contextBridge.exposeInMainWorld("electronAPI", {
  invoke(channel: string, data?: unknown) {
    return ipcRenderer.invoke(channel, data);
  },

  send(channel: string, data?: unknown) {
    ipcRenderer.send(channel, data);
  },

  on(channel: string, callback: (data: unknown) => void) {
    const listener = (
      _event: IpcRendererEvent,
      data: unknown
    ) => {
      callback(data);
    };

    ipcRenderer.on(channel, listener);

    return () => {
      ipcRenderer.off(channel, listener);
    };
  },
});