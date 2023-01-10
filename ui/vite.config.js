import { defineConfig } from "vite";
import renderer from "vite-plugin-electron-renderer";

export default defineConfig({
  base: "./",
  build: {
    outDir: "../dist",
    rollupOptions: {
      output: {
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `[name].[ext]`,
      },
    },
  },
  plugins: [renderer({ nodeIntegration: true })],
});
