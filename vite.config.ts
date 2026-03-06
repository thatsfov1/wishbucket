import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    allowedHosts: [
      "unpenetrant-meghan-unswaddled.ngrok-free.dev",
      "154d-46-112-93-242.ngrok-free.app",
    ],
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
