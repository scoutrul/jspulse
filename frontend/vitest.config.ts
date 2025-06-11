import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/lib/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,svelte}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/app.html',
        '**/*.d.ts',
        'coverage/**',
        '.svelte-kit/**'
      ]
    },
    alias: {
      $lib: '/src/lib',
      '$lib/*': '/src/lib/*',
      $app: '/src/app'
    }
  }
}); 