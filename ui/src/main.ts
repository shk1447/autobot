import "./style.css";
import "./w3.css";
import { ipcRenderer } from "electron";
import Alpine from "alpinejs";
import "@fortawesome/fontawesome-free/js/all.js";
window.Alpine = Alpine;

interface IHeader {
  title: string;
  exit: () => void;
}

interface IElectron {
  isCapture: boolean;
}

interface IFooter {
  snapshot: () => void;
  start: () => void;
}
ipcRenderer.invoke("click-through", { through: false });

Alpine.store("electron", {
  isCapture: false,
  toggleCapture() {
    this.isCapture = !this.isCapture;
    if (this.isCapture) {
      (Alpine.store("footer") as any).toggleSetting(false);
      ipcRenderer.invoke("record", true);
    } else {
      ipcRenderer.invoke("record", false);
    }
  },
  through: async (value: boolean) => {
    if ((Alpine.store("electron") as any).isCapture) {
      await ipcRenderer.invoke("click-through", { through: value });
    }
  },
});

Alpine.store("header", {
  title: "AUTO CAPTURE SYSTEM",
  exit: async () => {
    const result = await ipcRenderer.invoke("exit");
    console.log(result);
  },
} as IHeader);
// let count = 0;
// setInterval(() => {
//   const headerStore = Alpine.store("header") as IHeader;
//   headerStore.title = count.toString();
//   count++;
// }, 1000);

Alpine.store("footer", {
  snapshot: async () => {
    await ipcRenderer.invoke("capture");
  },
  play: async () => {
    await ipcRenderer.invoke("play");
  },
  setting: true,
  toggleSetting(val) {
    this.setting = val != undefined ? val : !this.setting;
  },
});

Alpine.start();
