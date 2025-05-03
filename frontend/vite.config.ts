import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      "@jspulse/shared": path.resolve(__dirname, "../shared/dist/types"), // Исправляем путь
    },
  },
  optimizeDeps: {
    include: ["@jspulse/shared"],
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    fs: {
      strict: false,
      allow: [path.resolve(__dirname, "../shared")],
    },
    // Необязательно: прокси для запросов к бэкенду (если frontend и backend на разных портах)
    // proxy: {
    //   '/api': 'http://localhost:3001' // URL вашего бэкенда
    // }
  },
});
