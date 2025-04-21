import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// This is required for Vite to work correctly with CodeSandbox
const server = process.env.APP_ENV === "sandbox" ? { hmr: { clientPort: 443 } } : { host: true };

// https://vitejs.dev/config/
export default defineConfig({
  server: server,
  resolve: {
    alias: {
      "@src": resolve(__dirname, "./src"),
    },
  },
  plugins: [react()],
  optimizeDeps: {
    exclude: [
      '@tensorflow/tfjs-core',
      '@tensorflow/tfjs-converter',
      '@tensorflow/tfjs-backend-webgl',
      '@tensorflow/tfjs-backend-cpu',
      '@tensorflow-models/pose-detection'
    ]
  },
  build: {
    rollupOptions: {
      external: [
        '@tensorflow/tfjs-backend-webgpu'
      ]
    }
  }
});
