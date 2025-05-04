import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');

// Рекурсивная функция для копирования директории
async function copyDir(src, dest) {
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
        await copyDir(srcPath, destPath);
      } else if (entry.isFile()) {
        if (srcPath.endsWith('.ts')) {
          // Для TypeScript файлов создаем два отдельных файла
          
          // 1. Создаем .d.ts файл (с типами)
          const dtsContent = await fs.readFile(srcPath, 'utf8');
          const dtsPath = destPath.replace('.ts', '.d.ts');
          await fs.writeFile(dtsPath, dtsContent);
          
          // 2. Создаем пустой .js файл со всеми экспортами
          const content = await fs.readFile(srcPath, 'utf8');
          
          // Создаем простой пустой экспорт для каждого экспортируемого типа
          const jsContent = '// Автоматически сгенерированный файл\n' +
                           '// Содержит только экспорты без реализации\n\n' + 
                           // Находим все экспортируемые сущности
                           content.match(/export\s+(interface|type|class|enum|const|function|let|var)\s+([a-zA-Z0-9_]+)/g)
                                 ?.map(exp => {
                                     // Извлекаем имя экспортируемой сущности
                                     const match = exp.match(/export\s+(interface|type|class|enum|const|function|let|var)\s+([a-zA-Z0-9_]+)/);
                                     if (match && match[2]) {
                                         const name = match[2];
                                         // Если это интерфейс или тип, экспортируем пустой объект
                                         if (match[1] === 'interface' || match[1] === 'type') {
                                             return `export const ${name} = {}; // Empty placeholder for TypeScript ${match[1]}`;
                                         }
                                     }
                                     return null;
                                 })
                                 .filter(Boolean)
                                 .join('\n');
          
          const jsPath = destPath.replace('.ts', '.js');
          await fs.writeFile(jsPath, jsContent || '// Empty export\nexport {};\n');
        } else {
          // Для других файлов просто копируем
          await fs.copyFile(srcPath, destPath);
        }
      }
    }
  } catch (error) {
    console.error(`Ошибка при копировании директории ${src}:`, error);
    throw error;
  }
}

// Основная функция сборки
async function build() {
  try {
    // Очищаем директорию dist
    await fs.rm(distDir, { recursive: true, force: true });
    
    // Копируем файлы из src в dist
    await copyDir(srcDir, distDir);
    
    console.log('Сборка завершена успешно!');
  } catch (error) {
    console.error('Ошибка при сборке:', error);
    process.exit(1);
  }
}

// Запускаем сборку
build(); 