import { defineConfig } from "vite";
import { resolve } from "path";
import renderer from "vite-plugin-electron-renderer";

export default defineConfig({
  root: "./pages",
  build: {
    outDir: resolve(__dirname, "../app"),
    rollupOptions: {
      input: {
        macro: resolve(__dirname, "./pages/macro/index.html"),
        setting: resolve(__dirname, "./pages/setting/index.html"),
      },
      output: {
        entryFileNames: `[name]/index.js`,
        chunkFileNames: `libs/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
  },
  plugins: [renderer({ nodeIntegration: true })],
});
