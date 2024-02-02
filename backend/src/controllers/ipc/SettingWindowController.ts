import { BrowserWindow, ipcMain } from "electron";

export default (window: BrowserWindow) => {
  let currentThrough = false;

  ipcMain.handle("setting_exit", (event, args) => {
    window.close();
  });

  ipcMain.handle("setting_minimize", (event, args) => {
    window.minimize();
  });

  ipcMain.handle("setting_maximize", async (event, args) => {
    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  });
};
