import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [sveltekit()],
  
  envDir: resolve(__dirname, '..'),

  resolve: {
    alias: {
      '@jspulse/shared': resolve(__dirname, '../shared/src')
    }
  },

  define: {
    'import.meta.env.VITE_BACKEND_URL': JSON.stringify('http://localhost:3001')
  },

  optimizeDeps: {
    include: ['@jspulse/shared']
  },

  server: {
    host: '0.0.0.0',
    port: 3000,
    fs: {
      strict: false,
      allow: [
        resolve(__dirname, '..'),
        resolve(__dirname, '../shared'),
        resolve(__dirname, '../shared/src')
      ]
    }
  }
});