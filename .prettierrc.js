// @ts-check

/** @type {import("prettier").Config} */
const config = {
  // Стандартные настройки Prettier
  printWidth: 100, // Длина строки
  tabWidth: 2, // Размер табуляции
  useTabs: false, // Использовать пробелы вместо табов
  semi: true, // Точка с запятой в конце строк
  singleQuote: false, // Использовать двойные кавычки для строк
  quoteProps: "as-needed", // Кавычки для свойств объекта только при необходимости
  jsxSingleQuote: false, // Двойные кавычки в JSX
  trailingComma: "es5", // Запятая в конце массивов и объектов (для ES5 совместимости)
  bracketSpacing: true, // Пробелы внутри скобок { key: value }
  bracketSameLine: false, // Закрывающая скобка '>' JSX на новой строке
  arrowParens: "always", // Скобки вокруг параметров стрелочных функций всегда (a) => ...
  endOfLine: "lf", // Символ конца строки LF

  // Настройки для Svelte
  // Убедитесь, что prettier-plugin-svelte установлен
  plugins: ["prettier-plugin-svelte"],
  overrides: [
    {
      files: "*.svelte",
      options: {
        parser: "svelte",
      },
    },
  ],
};

module.exports = config;
