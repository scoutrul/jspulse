import adapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import path from 'path';
import { fileURLToPath } from 'url';

// Получаем __dirname для ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter(),
    alias: {
      // Алиас для shared пакета
      '@jspulse/shared': path.resolve(__dirname, '../shared/src'),
      // Можно добавить другие алиасы, например, для $lib
      // '$lib': path.resolve(__dirname, './src/lib')
    }
  },
};

export default config;
