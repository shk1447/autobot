import { defineConfig } from "vite";
import { resolve } from "path";
import renderer from "vite-plugin-electron-renderer";

export default defineConfig({
  base: "./",
  build: {
    outDir: "../app",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        setting: resolve(__dirname, "setting.html"),
      },
      output: {
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `[name].[ext]`,
      },
    },
  },
  plugins: [renderer({ nodeIntegration: true })],
});
