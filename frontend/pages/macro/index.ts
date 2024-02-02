import "../../src/style.css";
import "../../src/w3.css";
import { ipcRenderer } from "electron";
import Alpine from "alpinejs";
import "@fortawesome/fontawesome-free/js/all.js";

import { registViewModel } from "property-process";

window.Alpine = Alpine;

interface IHeader {
  init: () => void;
  title: string;
  selectedProcess: string;
  exit: () => void;
  minimize: () => void;
  maximize: () => void;
  focusProcess: () => void;
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
  sceneName: string;
  current: { save: boolean };
  toggleCapture: () => void;
  through: (value: boolean) => void;
  loadItems: () => void;
  getResultImage: (item: any) => void;

  showSettingWindow: (uuid: string) => void;
}

interface IBody {
  init: () => void;
  diffImage: any;
}

interface IFooter {
  init: () => void;
  setting: boolean;
  snapshot: () => void;
  play: (list: string[] | undefined, isAll?: boolean, isTest?: boolean) => void;
  save: (args: {
    type: "new" | "update" | "remove";
    uuid: string;
    name: string;
  }) => void;
  toggleSetting: (val: boolean) => void;
  openUserFolder: () => void;
  saveScene: () => void;
  loadScene: () => void;
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
  selectedProcess: "",
  async focusProcess() {
    const result = await ipcRenderer.invoke("focusProcess");
    this.selectedProcess = result;
  },
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
    // document.addEventListener("keyup", (e) => {
    //   if (e.ctrlKey && e.key == "t") {
    //     ElectronViewModel.state.toggleCapture();
    //     // this.toggleCapture();
    //   }
    // });
    ElectronViewModel.property = this;
    ElectronViewModel.reset();
    this.loadItems();
  },
  isCapture: false,
  items: [],
  sceneName: "",
  current: { save: false },
  async loadItems() {
    const result = await ipcRenderer.invoke("load");
    this.items = result.list;
    console.log(this.items);
    this.current = result.current;
  },
  async toggleCapture() {
    this.isCapture = !this.isCapture;
    if (this.isCapture) {
      FooterViewModel.state.setting = false;
      ipcRenderer.invoke("record", true);
      await this.through(true);
    } else {
      ipcRenderer.invoke("record", false);
      await this.through(false);
      this.loadItems();
    }
  },
  async through(value: boolean) {
    await ipcRenderer.invoke("click-through", { through: value });
  },
  async getResultImage(item: any) {
    FooterViewModel.property.setting = false;
    const result = await ipcRenderer.invoke("getResultImage", {
      sceneName: ElectronViewModel.state.sceneName,
      item: JSON.parse(JSON.stringify(item)),
    });
    BodyViewModel.property.diffImage = result;
  },
  async showSettingWindow(uuid: string) {
    await ipcRenderer.invoke("showSettingWindow", { uuid: uuid });
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
  async play(list: string[] | undefined, isAll?: boolean, isTest?: boolean) {
    this.setting = false;
    await ipcRenderer.invoke("play", {
      list: list,
      sceneName: isAll ? ElectronViewModel.state.sceneName : undefined,
      isTest: isTest,
    });
    await ElectronViewModel.property.loadItems();
    if (list != undefined) {
      this.setting = true;
    }
  },
  setting: true,
  toggleSetting(val: boolean) {
    this.setting = val != undefined ? val : !this.setting;
  },
  async openUserFolder() {
    await ipcRenderer.invoke("openUserFolder", { query: "test" });
  },
  async save(args: {
    type: "new" | "update" | "remove" | "up" | "down";
    uuid: string;
    name: string;
  }) {
    await ipcRenderer.invoke("save", args);
    ElectronViewModel.property.loadItems();
  },
  async saveScene() {
    await ipcRenderer.invoke("saveScene", ElectronViewModel.state.sceneName);
    alert("시나리오가 저장되었습니다.");
    // ElectronViewModel.state.sceneName = "";
  },
  async loadScene() {
    const test = await ipcRenderer.invoke(
      "loadScene",
      ElectronViewModel.state.sceneName
    );
    ElectronViewModel.state.sceneName = test;
    await ElectronViewModel.property.loadItems();
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
