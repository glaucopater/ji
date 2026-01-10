import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// This is required for Vite to work correctly with CodeSandbox
const server0 = process.env.APP_ENV === "sandbox" ? { hmr: { clientPort: 443 } } : {};

const server = {
  host: "127.0.0.1", // Add this line for main HTTP server
  hmr: {
    // Remove or comment host line here too
    strictPort: true,
  },
  port: Number(process.env.VITE_PORT) || 5173,
  open: "/", // Ensures clean open
};

// https://vitejs.dev/config/
export default defineConfig({
  server: server,
  resolve: {
    alias: {
      "@src": resolve(__dirname, "./src"),
    },
  },
  plugins: [react()],
});
