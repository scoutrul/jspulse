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
        // Копируем файл и обрабатываем импорты
        let content = await fs.readFile(srcPath, 'utf8');
        
        // Для .ts файлов создаем .js и .d.ts файлы
        if (srcPath.endsWith('.ts')) {
          // Создаем .js файл (просто экспорты, для типов не нужна реальная реализация)
          const jsContent = content
            .replace(/import\s+.*?from\s+['"](.+?)['"]/g, (match, importPath) => {
              // Заменяем расширение .ts на .js в импортах
              if (!importPath.endsWith('.js') && !importPath.startsWith('@')) {
                return match.replace(importPath, `${importPath}.js`);
              }
              return match;
            })
            .replace(/export\s+interface/g, 'export {}; // interface')
            .replace(/export\s+type/g, 'export {}; // type');
          
          await fs.writeFile(destPath.replace('.ts', '.js'), jsContent);
          
          // Создаем .d.ts файл (декларация типов)
          await fs.writeFile(destPath.replace('.ts', '.d.ts'), content);
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