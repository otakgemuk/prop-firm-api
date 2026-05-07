import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import fs from "fs";

// Custom plugin to copy data files and assets to the output directory
function copyDataPlugin() {
  return {
    name: "copy-data",
    writeBundle() {
      // Copy plans.json
      const plansSrc = resolve(__dirname, "../data/plans.json");
      const plansDest = resolve(__dirname, "dist/plans.json");
      if (fs.existsSync(plansSrc)) {
        fs.copyFileSync(plansSrc, plansDest);
        console.log("[copy-data] plans.json → dist/plans.json");
      }
      // Copy logo.png from public/
      const logoSrc = resolve(__dirname, "public/logo.png");
      const logoDest = resolve(__dirname, "dist/logo.png");
      if (fs.existsSync(logoSrc)) {
        fs.copyFileSync(logoSrc, logoDest);
        console.log("[copy-data] logo.png → dist/logo.png");
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), copyDataPlugin()],
  // Use VITE_BASE env var to override (e.g. "/" for Render/Vercel, "/prop-firm-api/" for GitHub Pages)
  base: process.env.VITE_BASE || (process.env.VERCEL ? "/" : "/prop-firm-api/"),
  server: {
    port: 5173,
  },
  publicDir: resolve(__dirname, "../data"),
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        admin: resolve(__dirname, "admin.html"),
      },
    },
  },
});
