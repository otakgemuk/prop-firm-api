import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import fs from "fs";

// Custom plugin to copy data/plans.json to the output directory
function copyDataPlugin() {
  return {
    name: "copy-data",
    writeBundle() {
      const src = resolve(__dirname, "../data/plans.json");
      const dest = resolve(__dirname, "dist/plans.json");
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log("[copy-data] plans.json → dist/plans.json");
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), copyDataPlugin()],
  // Base path for GitHub Pages: /prop-firm-api/
  base: "/prop-firm-api/",
  server: {
    port: 5173,
  },
  // Make data/plans.json available during dev by serving from project root
  publicDir: resolve(__dirname, "../data"),
});
