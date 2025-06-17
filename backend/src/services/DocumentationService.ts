import { promises as fs } from 'fs';
import path from 'path';
import { AppError } from '../middleware/ApiError.js';

/**
 * Интерфейс для файла документации
 */
export interface DocumentationFile {
  path: string;
  name: string;
  size: number;
  modifiedAt: Date;
  isDirectory: boolean;
  relativePath: string;
}

/**
 * Интерфейс для содержимого файла
 */
export interface FileContent {
  path: string;
  name: string;
  content: string;
  modifiedAt: string;
  size: number;
  encoding: string;
}

/**
 * Интерфейс для результата поиска
 */
export interface SearchResult {
  path: string;
  name: string;
  matches: Array<{
    line: number;
    content: string;
    context: string;
  }>;
  totalMatches: number;
}

/**
 * Интерфейс для статистики документации
 */
export interface DocumentationStats {
  totalFiles: number;
  totalDirectories: number;
  totalSize: number;
  lastModified: Date | null;
  mostActiveFiles: Array<{
    path: string;
    name: string;
    modifiedAt: Date;
  }>;
  fileExtensions: Record<string, number>;
}

/**
 * Сервис для работы с документацией Memory Bank
 */
export class DocumentationService {
  private readonly memoryBankPath: string;
  private readonly allowedExtensions = ['.md', '.txt', '.json', '.yaml', '.yml'];

  constructor() {
    // Путь к Memory Bank от корня проекта
    this.memoryBankPath = path.resolve(process.cwd(), 'memory-bank');
  }

  /**
   * Получение списка файлов и папок из Memory Bank
   */
  async getFilesList(): Promise<DocumentationFile[]> {
    try {
      const files: DocumentationFile[] = [];

      await this.scanDirectory(this.memoryBankPath, '', files);

      // Сортируем: папки сначала, потом файлы по дате модификации
      files.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return b.modifiedAt.getTime() - a.modifiedAt.getTime();
      });

      return files;
    } catch (error) {
      console.error('Error scanning Memory Bank:', error);
      throw new Error('Failed to scan documentation files');
    }
  }

  /**
   * Рекурсивное сканирование директории
   */
  private async scanDirectory(dirPath: string, relativePath: string, files: DocumentationFile[]): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        // Пропускаем скрытые файлы и папки
        if (entry.name.startsWith('.')) continue;

        const fullPath = path.join(dirPath, entry.name);
        const relPath = relativePath ? path.join(relativePath, entry.name) : entry.name;

        const stats = await fs.stat(fullPath);

        if (entry.isDirectory()) {
          // Добавляем папку
          files.push({
            path: fullPath,
            name: entry.name,
            size: 0,
            modifiedAt: stats.mtime,
            isDirectory: true,
            relativePath: relPath
          });

          // Рекурсивно сканируем подпапки (только первый уровень для производительности)
          if (relativePath === '') {
            await this.scanDirectory(fullPath, relPath, files);
          }
        } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.txt'))) {
          // Добавляем только markdown и text файлы
          files.push({
            path: fullPath,
            name: entry.name,
            size: stats.size,
            modifiedAt: stats.mtime,
            isDirectory: false,
            relativePath: relPath
          });
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error);
      // Не бросаем ошибку, просто пропускаем эту папку
    }
  }

  /**
   * Получение содержимого конкретного файла
   */
  async getFileContent(relativePath: string): Promise<FileContent> {
    try {
      // Безопасность: проверяем что путь не выходит за пределы Memory Bank
      const safePath = this.sanitizePath(relativePath);
      const fullPath = path.join(this.memoryBankPath, safePath);

      // Проверяем что файл действительно находится в Memory Bank
      if (!fullPath.startsWith(this.memoryBankPath)) {
        throw new Error('Access denied: Path outside memory bank');
      }

      // Проверяем что файл существует
      const stats = await fs.stat(fullPath);
      if (!stats.isFile()) {
        throw new Error('Path is not a file');
      }

      // Читаем содержимое файла
      const content = await fs.readFile(fullPath, 'utf-8');

      return {
        content,
        path: relativePath,
        name: path.basename(relativePath),
        size: stats.size,
        modifiedAt: stats.mtime.toISOString(),
        encoding: 'utf-8'
      };
    } catch (error) {
      console.error(`Error reading file ${relativePath}:`, error);
      throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Очистка пути от небезопасных символов
   */
  private sanitizePath(inputPath: string): string {
    // Удаляем ../ и другие небезопасные элементы
    const normalized = path.normalize(inputPath);

    // Убираем ведущие ../ и /
    const safe = normalized.replace(/^(\.\.\/|\/)+/, '');

    return safe;
  }

  /**
   * Поиск файлов по запросу
   */
  async searchFiles(query: string): Promise<DocumentationFile[]> {
    try {
      const allFiles = await this.getFilesList();
      const queryLower = query.toLowerCase();

      return allFiles.filter(file =>
        !file.isDirectory &&
        (file.name.toLowerCase().includes(queryLower) ||
          file.relativePath.toLowerCase().includes(queryLower))
      );
    } catch (error) {
      console.error('Error searching files:', error);
      throw new Error('Failed to search files');
    }
  }

  /**
   * Получает список последних обновленных файлов
   */
  async getRecentFiles(limit = 10): Promise<DocumentationFile[]> {
    try {
      const files = await this.getFilesList();

      // Фильтруем только файлы (не директории) и сортируем по дате изменения
      const recentFiles = files
        .filter(file => !file.isDirectory && this.isAllowedFile(file.path))
        .sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime())
        .slice(0, limit);

      return recentFiles;
    } catch (error) {
      console.error('Error getting recent files:', error);
      throw AppError.internal('Failed to get recent files');
    }
  }

  /**
   * Поиск в файлах по содержимому
   */
  async searchInFiles(query: string, limit = 20): Promise<SearchResult[]> {
    try {
      const files = await this.getFilesList();
      const results: SearchResult[] = [];
      const searchRegex = new RegExp(query, 'gi');

      // Фильтруем только файлы для поиска
      const searchableFiles = files.filter(file =>
        !file.isDirectory && this.isAllowedFile(file.path)
      );

      for (const file of searchableFiles) {
        try {
          const content = await fs.readFile(file.path, 'utf-8');
          const lines = content.split('\n');
          const matches: Array<{ line: number; content: string; context: string; }> = [];

          lines.forEach((line, index) => {
            if (searchRegex.test(line)) {
              // Добавляем контекст: строку до и после
              const contextStart = Math.max(0, index - 1);
              const contextEnd = Math.min(lines.length - 1, index + 1);
              const context = lines.slice(contextStart, contextEnd + 1).join('\n');

              matches.push({
                line: index + 1,
                content: line.trim(),
                context: context.trim()
              });
            }
          });

          if (matches.length > 0) {
            results.push({
              path: file.relativePath,
              name: file.name,
              matches,
              totalMatches: matches.length
            });
          }

          // Ограничиваем количество результатов
          if (results.length >= limit) {
            break;
          }
        } catch (error) {
          // Пропускаем файлы, которые не удается прочитать
          console.warn(`Could not search in file ${file.path}:`, error);
        }
      }

      // Сортируем результаты по количеству совпадений
      results.sort((a, b) => b.totalMatches - a.totalMatches);

      return results;
    } catch (error) {
      console.error('Error searching in files:', error);
      throw AppError.internal('Failed to search in documentation');
    }
  }

  /**
   * Получает статистику документации
   */
  async getDocumentationStats(): Promise<DocumentationStats> {
    try {
      const files = await this.getFilesList();

      let totalFiles = 0;
      let totalDirectories = 0;
      let totalSize = 0;
      let lastModified: Date | null = null;
      const fileExtensions: Record<string, number> = {};

      for (const file of files) {
        if (file.isDirectory) {
          totalDirectories++;
        } else {
          totalFiles++;
          totalSize += file.size;

          // Отслеживаем последнее изменение
          if (!lastModified || file.modifiedAt > lastModified) {
            lastModified = file.modifiedAt;
          }

          // Подсчитываем расширения файлов
          const ext = path.extname(file.name) || 'no extension';
          fileExtensions[ext] = (fileExtensions[ext] || 0) + 1;
        }
      }

      // Получаем наиболее активные файлы (последние 5)
      const mostActiveFiles = files
        .filter(file => !file.isDirectory)
        .sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime())
        .slice(0, 5)
        .map(file => ({
          path: file.relativePath,
          name: file.name,
          modifiedAt: file.modifiedAt
        }));

      return {
        totalFiles,
        totalDirectories,
        totalSize,
        lastModified,
        mostActiveFiles,
        fileExtensions
      };
    } catch (error) {
      console.error('Error getting documentation stats:', error);
      throw AppError.internal('Failed to get documentation statistics');
    }
  }

  /**
   * Проверяет безопасность пути (защита от path traversal)
   */
  private validatePath(filePath: string): string {
    const normalizedPath = path.normalize(filePath);

    // Запрещаем выход за пределы memory-bank папки
    if (normalizedPath.includes('..') || path.isAbsolute(normalizedPath)) {
      throw AppError.badRequest('Invalid file path');
    }

    return normalizedPath;
  }

  /**
   * Проверяет, является ли файл разрешенным для чтения
   */
  private isAllowedFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return this.allowedExtensions.includes(ext) || ext === '';
  }
}

// Экспортируем singleton instance
export const documentationService = new DocumentationService(); 