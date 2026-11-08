import { defineConfig } from "vite";
import { nomadSite } from "./build/plugin";

export default defineConfig({
  appType: "custom",
  plugins: [nomadSite()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: { input: "src/main.ts" },
  },
});
