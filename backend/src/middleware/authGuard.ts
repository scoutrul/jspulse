import { Request, Response, NextFunction } from "express";
import { AppError } from "./ApiError";

// Расширяем интерфейс Request чтобы добавить поле user для аутентифицированных запросов
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

/**
 * Middleware для проверки авторизации
 * 
 * В текущей реализации - заглушка, которая проверяет наличие 
 * заголовка Authorization и парсит из него простейший токен
 * 
 * В реальном приложении здесь должна быть проверка JWT или другого
 * механизма аутентификации
 */
export const authGuard = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    // Если заголовок отсутствует, считаем запрос неавторизованным
    if (!authHeader) {
      // Для открытых эндпоинтов можно просто пропустить дальше
      // без добавления пользователя в request
      return next();
    }
    
    // Формат: "Bearer <token>"
    const [type, token] = authHeader.split(' ');
    
    if (type !== 'Bearer' || !token) {
      return next();
    }
    
    // ЗАГЛУШКА: в реальном приложении здесь будет проверка и декодирование JWT
    // В данной реализации просто проверяем, что токен имеет минимальную длину
    if (token.length < 10) {
      return next();
    }
    
    // В реальном приложении здесь будет реальная информация о пользователе из токена
    req.user = {
      id: "demo-user-id",
      role: "user"
    };
    
    next();
  } catch (error) {
    // В случае ошибки проверки авторизации просто пропускаем запрос дальше
    // без данных пользователя
    next();
  }
};

/**
 * Middleware для требования авторизации
 * Используется для защиты маршрутов, требующих авторизации
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw AppError.unauthorized("Для доступа к этому ресурсу требуется авторизация");
  }
  
  next();
};

/**
 * Middleware для проверки роли пользователя
 * @param roles Массив разрешенных ролей
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Сначала проверяем, авторизован ли пользователь
    if (!req.user) {
      throw AppError.unauthorized("Для доступа к этому ресурсу требуется авторизация");
    }
    
    // Затем проверяем роль
    if (!roles.includes(req.user.role)) {
      throw AppError.forbidden("У вас недостаточно прав для доступа к этому ресурсу");
    }
    
    next();
  };
}; 