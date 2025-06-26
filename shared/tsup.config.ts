import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  entry: ['src/index.ts'], // Оставляем одну точку входа
  format: ['esm'], // Собираем только в ES Module формат  
  target: 'es2020',
  platform: 'node',
  dts: true, // Генерировать .d.ts файлы
  sourcemap: true, // Генерировать sourcemaps
  clean: true, // Очищать dist перед сборкой
  minify: !options.watch, // Минифицировать только в продакшен-сборке
  splitting: false, // Отключить разделение кода
  treeshake: true, // Включить tree-shaking
  outExtension({ format }) {
    return {
      js: `.js`
    }
  }
})); 