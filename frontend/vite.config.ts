import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig(() => {
  return {
    envDir: '.',
    plugins: [sveltekit()],

    resolve: {
      alias: {
        "@jspulse/shared": path.resolve(__dirname, "../shared/types"),
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
    },
  };
});
