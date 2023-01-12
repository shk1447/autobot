import "./style.css";
import "./w3.css";
import { ipcRenderer } from "electron";
import Alpine from "alpinejs";
import "@fortawesome/fontawesome-free/js/all.js";

import { registViewModel } from "property-process";

window.Alpine = Alpine;

interface IHeader {
  init: () => void;
  title: string;
  exit: () => void;
}

interface IElectron {
  init: () => void;
  isCapture: boolean;
  toggleCapture: () => void;
  through: (value: boolean) => void;
}

interface IFooter {
  init: () => void;
  setting: boolean;
  snapshot: () => void;
  play: () => void;
  toggleSetting: (val: boolean) => void;
}

const { handler: HeaderViewModel } = registViewModel<IHeader>({
  init() {
    HeaderViewModel.property = this;
    HeaderViewModel.reset();
  },
  title: "AUTO CAPTURE SYSTEM",
  exit: async () => {
    await ipcRenderer.invoke("exit");
  },
});

const { handler: ElectronViewModel } = registViewModel<IElectron>({
  init() {
    ElectronViewModel.property = this;
    ElectronViewModel.reset();
  },
  isCapture: false,
  toggleCapture() {
    this.isCapture = !this.isCapture;
    if (this.isCapture) {
      FooterViewModel.state.setting = false;
      ipcRenderer.invoke("record", true);
    } else {
      ipcRenderer.invoke("record", false);
    }
  },
  async through(value: boolean) {
    if (ElectronViewModel.property.isCapture) {
      await ipcRenderer.invoke("click-through", { through: value });
    }
  },
});

let { handler: FooterViewModel } = registViewModel<IFooter>({
  init() {
    FooterViewModel.property = this;
    FooterViewModel.reset();
  },
  snapshot: async () => {
    await ipcRenderer.invoke("capture");
  },
  play: async () => {
    await ipcRenderer.invoke("play");
  },
  setting: false,
  toggleSetting(val: boolean) {
    this.setting = val != undefined ? val : !this.setting;
  },
});

ipcRenderer.invoke("click-through", { through: false });

Alpine.store("electron", ElectronViewModel.state);

Alpine.store("header", HeaderViewModel.state);

Alpine.store("footer", FooterViewModel.state);

Alpine.start();
