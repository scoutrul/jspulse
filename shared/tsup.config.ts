import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  entry: ['src/index.ts'], // Оставляем одну точку входа
  format: ['esm'], // Собираем только в ES Module формат
  dts: true, // Генерировать .d.ts файлы
  sourcemap: true, // Генерировать sourcemaps
  clean: true, // Очищать dist перед сборкой
  minify: !options.watch, // Минифицировать только в продакшен-сборке
  // Дополнительно: если хотите исключить zod из бандла
  // external: ['zod'],
})); 