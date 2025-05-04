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
        // Удаляем аннотации типов
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
      
      // Специальная обработка для полей дат
      if (path.basename(filePath) === 'vacancy.schema.ts') {
        // Заменяем publishedAt: z.any() на publishedAt: DateSchema
        jsContent = jsContent.replace(/publishedAt: z\.any\(\)/g, 'publishedAt: DateSchema');
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
      const jsContent = generateJSStubsForTypes(content);
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
 * @return {string} JavaScript-код с заглушками
 */
function generateJSStubsForTypes(content) {
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