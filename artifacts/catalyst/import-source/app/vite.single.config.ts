import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// Single-file build: everything inlined so dist-single/catalyst.html opens by double-click (file://).
export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  build: {
    outDir: "dist-single",
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 5000,
    rollupOptions: { output: { format: "iife", inlineDynamicImports: true, entryFileNames: "app.js", assetFileNames: "app[extname]" } },
  },
});
