import { BrowserWindow, ipcMain } from "electron";

export default (window: BrowserWindow) => {
  let currentThrough = false;

  ipcMain.handle("exit", (event, args) => {
    window.close();
  });

  ipcMain.handle("minimize", (event, args) => {
    window.minimize();
  });

  ipcMain.handle("maximize", async (event, args) => {
    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  });

  ipcMain.handle("click-through", async (event, args) => {
    if (args.through) {
      window.setIgnoreMouseEvents(true, { forward: true });
      currentThrough = true;
    } else {
      window.setIgnoreMouseEvents(false, { forward: true });
      currentThrough = false;
    }
  });
};
