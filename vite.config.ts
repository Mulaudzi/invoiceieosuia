import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Proxy API requests to Laravel backend during development
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react()],
  build: {
    // Public production bundles do not need implementation source maps.
    sourcemap: false,
    rollupOptions: {
      output: {
        // Shared-host FTP URLs reject literal spaces. Keep generated public
        // asset paths portable even when a source asset has a branded name.
        assetFileNames: (assetInfo) => {
          const sourceName = assetInfo.names?.[0] || "asset";
          const safeName = sourceName
            .replace(/\.[^.]+$/, "")
            .replace(/[^a-zA-Z0-9_-]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .toLowerCase();
          return `assets/${safeName}-[hash][extname]`;
        },
        chunkFileNames: (chunkInfo) => {
          const safeName = chunkInfo.name
            .replace(/[^a-zA-Z0-9_-]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .toLowerCase();
          return `assets/${safeName}-[hash].js`;
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": import.meta.dirname + "/src",
    },
  },
}));
