import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');

/**
 * Обрабатывает файлы TypeScript в зависимости от их содержимого
 * @param {string} filePath - Путь к исходному файлу
 * @param {string} destPath - Путь назначения
 */
async function processTypeScriptFile(filePath, destPath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const dtsPath = destPath.replace('.ts', '.d.ts');
    const jsPath = destPath.replace('.ts', '.js');
    
    // Особая обработка для index.ts файлов, которые содержат только экспорты
    const isIndexFile = path.basename(filePath) === 'index.ts';
    const containsOnlyExports = content.split('\n')
      .filter(line => line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('/*'))
      .every(line => line.trim().startsWith('export'));
      
    if (isIndexFile && containsOnlyExports) {
      console.log(`  ➤ Прямое копирование index файла: ${path.relative(rootDir, filePath)}`);
      
      // Для index.ts файлов, которые только реэкспортируют, копируем как есть
      await fs.writeFile(dtsPath, content);
      await fs.writeFile(jsPath, content);
      return;
    }
    
    // Проверяем, есть ли импорт zod
    const hasZodImport = content.includes('import { z } from "zod"') || content.includes("from 'zod'");
    
    // Определяем, содержит ли файл схемы Zod
    const hasZodSchemas = content.includes('z.object') || 
                         content.includes('z.string') ||
                         content.includes('z.number') ||
                         content.includes('z.array') ||
                         content.includes('z.enum') ||
                         content.includes('z.preprocess');

    // Проверяем наличие экспортов типов, полученных через z.infer
    const hasZodInferTypes = content.includes('z.infer<typeof');

    if (hasZodImport || hasZodSchemas) {
      // Для файлов со схемами Zod создаем JS файл с реальными импортами
      console.log(`  ➤ Обработка Zod-схемы: ${path.relative(rootDir, filePath)}`);
      
      // Создаем .d.ts файл для типов
      await fs.writeFile(dtsPath, content);
      
      // Обрабатываем импорты в JS-файле
      let jsContent = content
        // Преобразуем импорты типов в импорты значений
        .replace(/import\s+type\s+/g, 'import ')
        // Сохраняем свойства объектов в формате ключ-значение
        .replace(/(\w+):\s*([^,}]+),/g, (match, key, value) => {
          // Не изменяем определения типов объектов внутри z.object
          if (match.includes('z.object') || match.includes('z.string') || match.includes('z.number')) {
            return match;
          }
          return `${key}: ${value},`;
        })
        // Удаляем аннотации типов, но сохраняем выражения с ===, !==, typeof и instanceof
        .replace(/:\s*[A-Za-z_][A-Za-z0-9_<>[\].|,\s]*(?=(\s*[=;,)]|\s*\{))/g, '')
        // Удаляем generic параметры
        .replace(/<[^>]+>/g, '')
        // Удаляем все строки с export type
        .replace(/export\s+type\s+.*?;/g, '')
        // Удаляем строки с z.infer без присваивания
        .replace(/\s*z\.infer.*?;/g, '')
        // Полностью удаляем комментарии после которых идет z.infer;
        .replace(/\/\/.*\r?\n\s*z\.infer.*;/g, '');
        
      // Проверка на пропущенные типы в полях схем
      if (jsContent.includes(',\n  }') || jsContent.includes('},\n}')) {
        // Удаляем строки, которые могли остаться без типов
        jsContent = jsContent
          .replace(/(\w+)(,\s*[\r\n]\s*[})])/g, '$1: z.any()$2')
          .replace(/(\w+)(,\s*[\r\n])/g, '$1: z.any()$2');
      }
      
      // Исправляем случаи с обрезанными оператором ===
      jsContent = jsContent
        .replace(/(\w+)===\s*([^,}:]+)([,}])/g, '$1: val === $2$3')
        .replace(/(\w+)!==\s*([^,}:]+)([,}])/g, '$1: val !== $2$3')
        .replace(/typeof\s+val\s*===\s*/g, 'typeof val === ');
      
      // Специальная обработка для файла date.schema.ts
      if (path.basename(filePath) === 'date.schema.ts') {
        console.log(`  ➤ Специальная обработка date.schema.ts`);
        jsContent = `import { z } from "zod";

/**
 * Универсальная схема для валидации дат с предобработкой.
 * Обрабатывает различные форматы входных данных и преобразует их в Date.
 */
export const DateSchema = z.preprocess(
  (val) => {
    // Debug-логирование входного значения
    console.log(\`[DateSchema] Валидация даты, входные данные:\`, {
      value: val,
      type: typeof val,
      isNull: val === null,
      isUndefined: val === undefined,
      isDate: val instanceof Date,
      isObject: typeof val === 'object' && val !== null
    });
    
    if (val === undefined || val === null) {
      console.log(\`[DateSchema] Получено null/undefined, возвращаем null\`);
      return null;
    }
    
    if (val instanceof Date) {
      const isValid = !isNaN(val.getTime());
      console.log(\`[DateSchema] Получен Date, валидность:\`, isValid);
      return isValid ? val : null;
    }
    
    if (typeof val === "string") {
      console.log(\`[DateSchema] Получена строка:\`, val);
      
      if (val.trim() === '') {
        console.log(\`[DateSchema] Пустая строка, возвращаем null\`);
        return null;
      }
      
      const date = new Date(val);
      const isValid = !isNaN(date.getTime());
      console.log(\`[DateSchema] Валидность строки как даты:\`, isValid);
      return isValid ? date : null;
    }
    
    if (typeof val === "number") {
      console.log(\`[DateSchema] Получено число:\`, val);
      
      if (val < 0 || val > 4102444800000) {
        console.log(\`[DateSchema] Число вне разумного диапазона, возвращаем null\`);
        return null;
      }
      
      const date = new Date(val);
      const isValid = !isNaN(date.getTime());
      console.log(\`[DateSchema] Валидность числа как timestamp:\`, isValid);
      return isValid ? date : null;
    }
    
    if (typeof val === "object" && val !== null && "getTime" in val) {
      console.log(\`[DateSchema] Получен объект с методом getTime\`);
      
      try {
        if (typeof val.getTime === "function") {
          const timestamp = val.getTime();
          
          if (typeof timestamp === "number" && !isNaN(timestamp)) {
            const date = new Date(timestamp);
            const isValid = !isNaN(date.getTime());
            console.log(\`[DateSchema] Валидность объекта с getTime:\`, isValid);
            return isValid ? date : null;
          }
        }
      } catch (error) {
        console.log(\`[DateSchema] Ошибка при вызове getTime:\`, error);
        return null;
      }
    }
    
    console.log(\`[DateSchema] Неподдерживаемый формат даты:\`, val);
    return null;
  },
  z.date({
    invalid_type_error: "Некорректный формат даты",
    required_error: "Дата обязательна",
  })
);

/**
 * Схема для опциональной даты
 */
export const OptionalDateSchema = DateSchema.optional().nullable();

/**
 * Схема для строго обязательной даты
 */
export const RequiredDateSchema = DateSchema.refine(
  (date) => date !== null && date !== undefined && !isNaN(date.getTime()),
  {
    message: "Дата обязательна и должна быть корректной",
  }
);`;
      }
      
      // Специальная обработка для файла api.schema.ts
      if (path.basename(filePath) === 'api.schema.ts') {
        console.log(`  ➤ Специальная обработка api.schema.ts`);
        jsContent = `import { z } from "zod";
import { VacancyDTOSchema } from "./vacancy.schema.js";

/**
 * Схема для ошибки API
 */
export const ApiErrorSchema = z.object({
  code: z.number(),
  message: z.string(),
  details: z.any().optional(),
});

/**
 * Схема для метаданных пагинации
 */
export const PaginationSchema = z.object({
  page: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
});

/**
 * Общая схема успешного API-ответа
 */
export const ApiSuccessSchema = z.object({
  success: z.literal(true),
  data: z.any(),
  meta: z.any().optional(),
});

/**
 * Общая схема неуспешного API-ответа
 */
export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: ApiErrorSchema,
});

/**
 * Схема для API-ответа со списком вакансий и пагинацией
 */
export const VacancyListResponseSchema = ApiSuccessSchema.extend({
  data: z.array(VacancyDTOSchema),
  meta: PaginationSchema,
});

/**
 * Схема для API-ответа с одной вакансией
 */
export const SingleVacancyResponseSchema = ApiSuccessSchema.extend({
  data: VacancyDTOSchema,
});

/**
 * Объединенная схема для любого API-ответа
 */
export const ApiResponseSchema = z.union([
  ApiSuccessSchema,
  ApiErrorResponseSchema,
]);

// Экспортируем типы из схем Zod
export const ApiError = ApiErrorSchema;
export const Pagination = PaginationSchema;
export const ApiSuccess = ApiSuccessSchema;
export const ApiErrorResponse = ApiErrorResponseSchema;
export const VacancyListResponse = VacancyListResponseSchema;
export const SingleVacancyResponse = SingleVacancyResponseSchema;
export const ApiResponse = ApiResponseSchema;`;
      }
      
      // Специальная обработка для файла vacancy.schema.ts
      if (path.basename(filePath) === 'vacancy.schema.ts') {
        console.log(`  ➤ Специальная обработка vacancy.schema.ts`);
        jsContent = `import { z } from "zod";
import { DateSchema, OptionalDateSchema } from "./date.schema.js";

/**
 * Базовая схема вакансии с общими полями для всех источников.
 */
export const BaseVacancySchema = z.object({
  externalId: z.string({
    required_error: "ID вакансии во внешней системе обязателен",
  }),
  title: z.string({
    required_error: "Название вакансии обязательно",
  }).min(1, "Название вакансии не может быть пустым"),
  company: z.string({
    required_error: "Название компании обязательно",
  }).min(1, "Название компании не может быть пустым"),
  location: z.string({
    required_error: "Местоположение обязательно",
  }).min(1, "Местоположение не может быть пустым"),
  url: z.string({
    required_error: "URL вакансии обязателен",
  }).url("Некорректный URL вакансии"),
  publishedAt: DateSchema,
  source: z.string({
    required_error: "Источник вакансии обязателен",
  }).min(1, "Источник вакансии не может быть пустым"),
});

/**
 * Схема DTO вакансии для передачи между бэкендом и фронтендом
 */
export const VacancyDTOSchema = BaseVacancySchema.extend({
  _id: z.string().optional(),
  description: z.string().optional(),
  schedule: z.string().optional(),
  skills: z.array(z.string()).default([]),
  salaryFrom: z.number().optional().nullable(),
  salaryTo: z.number().optional().nullable(),
  salaryCurrency: z.string().optional().nullable(),
  experience: z.string().optional().nullable(),
  employment: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  htmlDescription: z.string().optional().nullable(),
});

/**
 * Схема для создания новой вакансии (без _id)
 */
export const CreateVacancySchema = VacancyDTOSchema.omit({ _id: true });

/**
 * Схема для обновления существующей вакансии (все поля опциональны)
 */
export const UpdateVacancySchema = VacancyDTOSchema.partial();

/**
 * Схема для поиска вакансий
 */
export const VacancySearchSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  source: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  sortBy: z.enum(["relevance", "date", "salary"]).default("relevance"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

// Экспортируем типы из схем Zod
export const BaseVacancy = BaseVacancySchema;
export const VacancyDTO = VacancyDTOSchema;
export const CreateVacancy = CreateVacancySchema;
export const UpdateVacancy = UpdateVacancySchema;
export const VacancySearch = VacancySearchSchema;`;
      }
      
      // Удаляем финальные пустые строки в конце файла
      jsContent = jsContent.replace(/\n+\s*$/, '\n');
        
      await fs.writeFile(jsPath, jsContent);
    } else {
      // Для обычных файлов типов
      console.log(`  ➤ Копирование типов: ${path.relative(rootDir, filePath)}`);
      
      // Создаем .d.ts файл
      await fs.writeFile(dtsPath, content);
      
      // Создаем .js файл с пустыми экспортами или с экспортами типов-заглушек
      const jsContent = generateJSStubsForTypes(content, filePath);
      await fs.writeFile(jsPath, jsContent);
    }
  } catch (error) {
    console.error(`Ошибка при обработке TypeScript файла ${filePath}:`, error);
    throw error;
  }
}

/**
 * Генерирует JavaScript-заглушки для экспортов типов
 * @param {string} content - Содержимое TypeScript файла
 * @param {string} filePath - Путь к файлу (для особой обработки определенных файлов)
 * @return {string} JavaScript-код с заглушками
 */
function generateJSStubsForTypes(content, filePath = '') {
  // Специальная обработка для schemas/index.ts
  if (filePath.includes('schemas/index.ts') || filePath.includes('schemas\\index.ts')) {
    return `// Экспортируем все схемы
export * from "./date.schema.js";
export * from "./vacancy.schema.js";
export * from "./api.schema.js";`;
  }

  let jsContent = '// Автоматически сгенерированный файл\n';
  jsContent += '// Содержит заглушки для TypeScript типов\n\n';
  
  // Удаляем все "export type" выражения перед обработкой
  const contentWithoutExportTypes = content.replace(/export\s+type\s+.*?[;{]/g, '');
  
  // Находим все экспорты
  const exportMatches = contentWithoutExportTypes.match(/export\s+(interface|type|class|enum|const|function|let|var)\s+([a-zA-Z0-9_]+)/g);
  
  if (exportMatches) {
    const exports = exportMatches
      .map(exp => {
        const match = exp.match(/export\s+(interface|type|class|enum|const|function|let|var)\s+([a-zA-Z0-9_]+)/);
        if (match && match[2]) {
          const name = match[2];
          const kind = match[1];
          
          if (kind === 'interface' || kind === 'type') {
            return `export const ${name} = {}; // Заглушка для TypeScript ${kind}`;
          } else if (kind === 'enum') {
            return `export const ${name} = {}; // Заглушка для enum`;
          }
        }
        return null;
      })
      .filter(Boolean)
      .join('\n');
    
    jsContent += exports || 'export {};';
  } else {
    jsContent += 'export {};';
  }
  
  return jsContent;
}

/**
 * Рекурсивно копирует директорию с обработкой TypeScript файлов
 * @param {string} src - Исходная директория
 * @param {string} dest - Целевая директория
 */
async function copyDirWithProcessing(src, dest) {
  try {
    // Создаем директорию назначения, если она не существует
    await fs.mkdir(dest, { recursive: true });
    
    // Получаем содержимое исходной директории
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    // Обрабатываем каждый элемент
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        // Рекурсивно копируем поддиректорию
        await copyDirWithProcessing(srcPath, destPath);
      } else if (entry.isFile()) {
        if (srcPath.endsWith('.ts')) {
          // Обрабатываем TypeScript файл
          await processTypeScriptFile(srcPath, destPath);
        } else {
          // Просто копируем другие файлы
          await fs.copyFile(srcPath, destPath);
        }
      }
    }
  } catch (error) {
    console.error(`Ошибка при копировании директории ${src}:`, error);
    throw error;
  }
}

/**
 * Основная функция сборки
 */
async function build() {
  try {
    console.log('📦 Начинаем сборку @jspulse/shared...');
    
    // Очищаем директорию dist
    console.log('🧹 Очистка директории dist...');
    await fs.rm(distDir, { recursive: true, force: true });
    
    // Создаем необходимые директории
    console.log('📁 Создание структуры директорий...');
    await fs.mkdir(path.join(distDir, 'schemas'), { recursive: true });
    await fs.mkdir(path.join(distDir, 'types', 'core'), { recursive: true });
    await fs.mkdir(path.join(distDir, 'types', 'db'), { recursive: true });
    await fs.mkdir(path.join(distDir, 'types', 'dto'), { recursive: true });
    await fs.mkdir(path.join(distDir, 'types', 'sources'), { recursive: true });
    
    // Копируем и обрабатываем файлы
    console.log('🔄 Копирование файлов из src в dist с обработкой...');
    await copyDirWithProcessing(srcDir, distDir);
    
    console.log('✅ Сборка успешно завершена!');
    
    // Проверяем и исправляем экспорты
    const indexPath = path.join(distDir, 'index.js');
    if (await fs.stat(indexPath).catch(() => false)) {
      console.log('📝 Проверка экспортов в index.js...');
      let indexContent = await fs.readFile(indexPath, 'utf8');
      
      // Проверяем наличие экспорта схем
      if (!indexContent.includes("export * from './schemas/index.js'")) {
        console.log('⚠️ Добавляем экспорт схем в index.js');
        
        // Исправляем index.js, добавляя экспорт схем
        if (indexContent.includes("export * from './types/index.js'")) {
          indexContent = indexContent.replace(
            "export * from './types/index.js';",
            "export * from './types/index.js';\n\n// Экспортируем все схемы и их типы из schemas\nexport * from './schemas/index.js';"
          );
          await fs.writeFile(indexPath, indexContent);
          console.log('✓ Экспорты схем добавлены');
        } else {
          indexContent += "\n\n// Экспортируем все схемы и их типы из schemas\nexport * from './schemas/index.js';";
          await fs.writeFile(indexPath, indexContent);
          console.log('✓ Экспорты схем добавлены');
        }
      } else {
        console.log('✓ Экспорты схем настроены корректно');
      }
    }
  } catch (error) {
    console.error('❌ Ошибка при сборке:', error);
    process.exit(1);
  }
}

// Запускаем сборку
build(); 