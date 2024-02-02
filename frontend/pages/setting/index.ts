import "../../src/style.css";
import "../../src/w3.css";
import { ipcRenderer } from "electron";
import { registViewModel } from "property-process";
import Alpine from "alpinejs";
import "@fortawesome/fontawesome-free/js/all.js";

export interface ISettingViewModel {
  init: () => void;
  hide: () => void;
  clicks: any[];
  uuid: string;
  save: (args: {
    type: "update_click" | "remove";
    uuid: string;
    idx: number;
    name: string;
  }) => void;
}

const { handler: SettingViewModel } = registViewModel<ISettingViewModel>({
  init() {
    SettingViewModel.property = this;
    SettingViewModel.reset();
    ipcRenderer.on("uuid", async (event, uuid) => {
      this.uuid = uuid;
      const result = await ipcRenderer.invoke("getClickHooks", uuid);
      this.clicks = result;
    });
  },
  uuid: "",
  clicks: [],
  async hide() {
    await ipcRenderer.invoke("hideSettingWindow");
  },
  async save(args) {
    await ipcRenderer.invoke("save", args);
  },
});
window.Alpine = Alpine;

Alpine.store("setting", SettingViewModel.state);

Alpine.start();
