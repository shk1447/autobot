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
  maximize: () => void;
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
  current: { save: boolean };
  toggleCapture: () => void;
  through: (value: boolean) => void;
  loadItems: () => void;
  getResultImage: (item: any) => void;

  showSettingWindow: () => void;
}

interface IBody {
  init: () => void;
  diffImage: any;
}

interface IFooter {
  init: () => void;
  setting: boolean;
  snapshot: () => void;
  play: (list: string[] | undefined) => void;
  save: (args: {
    type: "new" | "update" | "remove";
    uuid: string;
    name: string;
  }) => void;
  toggleSetting: (val: boolean) => void;
}

const { handler: BodyViewModel } = registViewModel<IBody>({
  init() {
    BodyViewModel.property = this;
    BodyViewModel.reset();
  },
  diffImage: null,
});

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
  maximize: async () => {
    await ipcRenderer.invoke("maximize");
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
  current: { save: false },
  async loadItems() {
    const result = await ipcRenderer.invoke("load");
    this.items = result.list;
    this.current = result.current;
  },
  toggleCapture() {
    this.isCapture = !this.isCapture;
    if (this.isCapture) {
      FooterViewModel.state.setting = false;
      ipcRenderer.invoke("record", true);
    } else {
      ipcRenderer.invoke("record", false);
      this.loadItems();
    }
  },
  async through(value: boolean) {
    if (ElectronViewModel.property.isCapture) {
      await ipcRenderer.invoke("click-through", { through: value });
    }
  },
  async getResultImage(item: any) {
    FooterViewModel.property.setting = false;
    const result = await ipcRenderer.invoke(
      "getResultImage",
      JSON.parse(JSON.stringify(item))
    );
    BodyViewModel.property.diffImage = result;
  },
  async showSettingWindow() {
    await ipcRenderer.invoke("settingWindow", { query: "test" });
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
  async play(list: string[] | undefined) {
    this.setting = false;
    await ipcRenderer.invoke("play", list);
    await ElectronViewModel.property.loadItems();
    if (list != undefined) {
      this.setting = true;
    }
  },
  setting: true,
  toggleSetting(val: boolean) {
    this.setting = val != undefined ? val : !this.setting;
  },
  async save(args: {
    type: "new" | "update" | "remove";
    uuid: string;
    name: string;
  }) {
    await ipcRenderer.invoke("save", args);
    ElectronViewModel.property.loadItems();
  },
});

FooterViewModel.on("setting", async () => {
  await ElectronViewModel.property.loadItems();
  BodyViewModel.property.diffImage = null;
});
ElectronViewModel.on("isCapture", () => {
  BodyViewModel.property.diffImage = null;
});

ipcRenderer.invoke("click-through", { through: false });

Alpine.store("electron", ElectronViewModel.state);

Alpine.store("header", HeaderViewModel.state);

Alpine.store("body", BodyViewModel.state);

Alpine.store("footer", FooterViewModel.state);

Alpine.start();
