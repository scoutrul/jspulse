import { Request, Response, NextFunction } from 'express';
import { IDIContainer, Constructor } from '@jspulse/shared';

/**
 * Расширение Express Request для поддержки DI Container.
 * Позволяет получать зависимости напрямую из middleware и маршрутов.
 */
declare global {
  namespace Express {
    interface Request {
      // DI Container для текущего request scope
      container: IDIContainer;

      // Удобный метод для разрешения зависимостей
      resolve<T>(token: string | symbol | Constructor<T>): T;
    }
  }
}

/**
 * Middleware для инициализации DI Container в Express request.
 * Создает scoped контейнер для каждого HTTP запроса, обеспечивая
 * изоляцию состояния и автоматическую очистку ресурсов.
 */
export function createDIMiddleware(rootContainer: IDIContainer) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Создаем scoped контейнер для изоляции request-specific зависимостей
    req.container = rootContainer.createScope();

    // Добавляем удобный метод для разрешения зависимостей
    req.resolve = <T>(token: string | symbol | Constructor<T>): T => {
      return req.container.resolve<T>(token);
    };

    // Обеспечиваем автоматическую очистку ресурсов после завершения запроса
    res.on('finish', async () => {
      try {
        await req.container.dispose();
      } catch (error) {
        console.error('Error disposing request container:', error);
      }
    });

    // Обрабатываем случай внезапного закрытия соединения
    res.on('close', async () => {
      try {
        await req.container.dispose();
      } catch (error) {
        console.error('Error disposing request container on close:', error);
      }
    });

    next();
  };
}

/**
 * Утилитарная функция для безопасного получения сервиса из контейнера.
 * Возвращает undefined вместо выброса ошибки, если сервис не зарегистрирован.
 */
export function tryResolve<T>(
  container: IDIContainer,
  token: string | symbol | Constructor<any>
): T | undefined {
  try {
    if (container.isRegistered(token)) {
      return container.resolve<T>(token);
    }
    return undefined;
  } catch (error) {
    console.warn(`Failed to resolve service ${String(token)}:`, error);
    return undefined;
  }
}

/**
 * Декоратор для Express route handlers с автоматической инъекцией зависимостей.
 * Упрощает получение сервисов в контроллерах без прямого обращения к контейнеру.
 */
export function withDI<T extends any[]>(
  tokens: Array<string | symbol | Constructor<any>>,
  handler: (req: Request, res: Response, next: NextFunction, ...services: T) => Promise<void> | void
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Разрешаем все указанные зависимости
      const services = tokens.map(token => req.resolve(token)) as T;

      // Вызываем оригинальный handler с инжектированными зависимостями
      await handler(req, res, next, ...services);
    } catch (error) {
      // Передаем ошибку в Express error handler
      next(error);
    }
  };
}

/**
 * Middleware для логирования статистики DI Container.
 * Полезно для мониторинга использования зависимостей в development.
 */
export function createDIStatsMiddleware(rootContainer: IDIContainer) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (process.env.NODE_ENV === 'development') {
      // Логируем статистику только в development режиме
      const stats = (rootContainer as any).getStats?.();
      if (stats) {
        console.log(`[DI Stats] Services: ${stats.registeredServices}, Singletons: ${stats.singletonInstances}, Scopes: ${stats.childScopes}`);
      }
    }
    next();
  };
}

/**
 * Error handler для ошибок DI Container.
 * Обрабатывает специфичные ошибки разрешения зависимостей.
 */
export function diErrorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Проверяем что это ошибка DI Container
  if (error.message.includes('is not registered') ||
    error.message.includes('Service resolution failed')) {

    console.error(`[DI Error] ${error.message}`);

    res.status(500).json({
      success: false,
      error: 'Internal server error: service configuration issue',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });

    return;
  }

  // Передаем другие ошибки дальше
  next(error);
} 