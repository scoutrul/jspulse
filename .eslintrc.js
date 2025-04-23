// @ts-check

/** @type {import('eslint').Linter.Config} */
const config = {
  root: true, // Указываем ESLint, что это корневая конфигурация
  parser: "@typescript-eslint/parser", // Используем парсер для TypeScript
  plugins: [
    "@typescript-eslint", // Плагин для правил TypeScript
    "svelte", // Плагин для Svelte (определяется через overrides)
    "prettier", // Плагин для интеграции с Prettier
  ],
  extends: [
    "eslint:recommended", // Базовые рекомендованные правила ESLint
    "plugin:@typescript-eslint/recommended", // Рекомендованные правила для TypeScript
    // 'plugin:svelte/recommended', // Рекомендованные правила для Svelte - включается в overrides
    "plugin:prettier/recommended", // Интеграция с Prettier (должен быть последним)
  ],
  env: {
    browser: true, // Разрешаем глобальные переменные браузера
    node: true, // Разрешаем глобальные переменные Node.js
    es2021: true, // Включаем поддержку ES2021
  },
  parserOptions: {
    ecmaVersion: "latest", // Используем последнюю версию ECMAScript
    sourceType: "module", // Используем модули ES
  },
  ignorePatterns: [
    ".eslintrc.js", // Игнорируем сам файл конфигурации ESLint
    "node_modules/",
    "dist/",
    "build/",
    ".svelte-kit/",
    "data/", // Данные Docker/Mongo
    "*.config.js", // Общие файлы конфигурации (vite, postcss, tailwind, etc.)
    "*.config.ts",
    "**/__mocks__/", // Стандартная папка для моков
  ],
  rules: {
    // Здесь можно добавить/переопределить специфичные правила
    "prettier/prettier": "warn", // Показываем ошибки Prettier как предупреждения ESLint
    "@typescript-eslint/no-unused-vars": [
      // Неиспользуемые переменные - ошибка
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }, // Разрешаем неиспользуемые с _
    ],
    "@typescript-eslint/explicit-module-boundary-types": "off", // Не требуем явно указывать тип возвращаемого значения для экспортируемых функций
    "@typescript-eslint/no-explicit-any": "warn", // Предупреждение при использовании any
  },
  overrides: [
    // Настройки для файлов Svelte
    {
      files: ["*.svelte"],
      // parser: 'svelte-eslint-parser', // Svelte парсер - уже не нужен явно в ESLint 9+ с плагином
      // Не указываем parser здесь, плагин svelte должен его подхватить
      extends: ["plugin:svelte/recommended"], // Применяем правила Svelte только к .svelte файлам
      parserOptions: {
        // Доп. настройки парсера для TypeScript внутри <script lang="ts">
        parser: "@typescript-eslint/parser",
        // Не нужно указывать project здесь, если нет строгих правил с типами
        extraFileExtensions: [".svelte"],
      },
      rules: {
        // Отключаем некоторые правила в Svelte, если необходимо
        // Например, проверка импортов может работать иначе
      },
    },
    // Настройки для файлов конфигурации (если нужно линтить)
    {
      files: ["*.config.js", "*.config.ts", ".prettierrc.js"],
      env: {
        node: true,
      },
      rules: {
        "@typescript-eslint/no-var-requires": "off", // Разрешаем require в JS конфигах
      },
    },
  ],
};

// Используем CommonJS export вместо ES Modules для совместимости с ESLint 8.x
module.exports = config;
