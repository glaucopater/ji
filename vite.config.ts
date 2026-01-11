import { resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// This is required for Vite to work correctly with CodeSandbox
const baseServerConfig = process.env.APP_ENV === "sandbox" 
  ? { hmr: { clientPort: 443 } } 
  : { host: "127.0.0.1" };

const server = {
  ...baseServerConfig,
  hmr: {
    ...(baseServerConfig.hmr || {}),
    strictPort: true,
  },
  port: Number(process.env.VITE_PORT) || 5173,
  open: "/", // Ensures clean open
};

// https://vitejs.dev/config/
export default defineConfig({
  server,
  resolve: {
    alias: {
      "@src": resolve(__dirname, "./src"),
    },
  },
  plugins: [react()]
});
