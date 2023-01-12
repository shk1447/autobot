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
  minimize: () => void;
}

type Item = {
  id: number;
  hooks: any[];
  cron: [];
};

interface IElectron {
  init: () => void;
  isCapture: boolean;
  items: Item[];
  toggleCapture: () => void;
  through: (value: boolean) => void;
  loadItems: () => void;
}

interface IFooter {
  init: () => void;
  setting: boolean;
  snapshot: () => void;
  play: (idx: number | undefined) => void;
  save: (args: {
    type: "new" | "update" | "remove";
    idx: number;
    name: string;
  }) => void;
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
  minimize: async () => {
    await ipcRenderer.invoke("minimize");
  },
});

const { handler: ElectronViewModel } = registViewModel<IElectron>({
  init() {
    ElectronViewModel.property = this;
    ElectronViewModel.reset();
    this.loadItems();
  },
  isCapture: false,
  items: [],
  async loadItems() {
    const result = await ipcRenderer.invoke("load");
    this.items = result.list;
  },
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
  async play(idx: number | undefined) {
    this.setting = false;
    await ipcRenderer.invoke("play", idx);
    if (idx != undefined) this.setting = true;
  },
  setting: true,
  toggleSetting(val: boolean) {
    this.setting = val != undefined ? val : !this.setting;
  },
  async save(args: {
    type: "new" | "update" | "remove";
    idx: number;
    name: string;
  }) {
    console.log(args);
    await ipcRenderer.invoke("save", args);
    ElectronViewModel.property.loadItems();
  },
});

ipcRenderer.invoke("click-through", { through: false });

Alpine.store("electron", ElectronViewModel.state);

Alpine.store("header", HeaderViewModel.state);

Alpine.store("footer", FooterViewModel.state);

Alpine.start();
