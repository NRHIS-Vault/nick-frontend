import "dotenv/config"; // Loads .env files so loadEnv can pick them up during build.
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load VITE_* variables for the current mode without failing when values are absent.
  const env = loadEnv(mode, process.cwd(), "VITE_");

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Expose env at build time if ever needed for replacement; runtime still uses import.meta.env.
    define: {
      __APP_ENV__: env,
    },
  };
});
