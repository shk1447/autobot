import "./style.css";
import { ipcRenderer } from "electron";
import Alpine from "alpinejs";
import "@fortawesome/fontawesome-free/js/all.js";
window.Alpine = Alpine;

interface IHeader {
  title: string;
  exit: () => void;
}

Alpine.store("header", {
  title: "AUTO SYSTEM",
  exit: async () => {
    const result = await ipcRenderer.invoke("exit");
    console.log(result);
  },
} as IHeader);
let count = 0;
setInterval(() => {
  const headerStore = Alpine.store("header") as IHeader;
  headerStore.title = count.toString();
  count++;
}, 1000);

Alpine.store("footer", {
  status: async () => {},
});

Alpine.start();
