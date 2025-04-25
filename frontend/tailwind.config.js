import { skeleton } from "@skeletonlabs/tw-plugin";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,js,svelte,ts}", // Указываем пути для сканирования
    // Добавляем путь к файлам Skeleton UI
    require("path").join(require.resolve("@skeletonlabs/skeleton"), "../**/*.{html,js,svelte,ts}"),
  ],
  theme: {
    extend: {},
  },
  plugins: [
    skeleton({
      themes: { preset: ["skeleton"] }, // Используем базовую тему Skeleton
    }),
  ],
};
