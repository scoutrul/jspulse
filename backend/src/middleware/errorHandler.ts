import { Request, Response, NextFunction } from "express";

// Интерфейс для кастомных ошибок с дополнительными свойствами
export interface ApiError extends Error {
  statusCode?: number;
  details?: unknown;
}

/**
 * Middleware для централизованной обработки ошибок
 * Форматирует ответ при возникновении ошибок
 */
export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Определяем статус ошибки (по умолчанию 500)
  const statusCode = err.statusCode || 500;
  
  // Формируем объект ответа с ошибкой
  const errorResponse = {
    status: "ERROR",
    message: err.message || "Произошла непредвиденная ошибка",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    details: err.details
  };
  
  // Логируем ошибку на сервере
  console.error(`[ERROR] ${req.method} ${req.url} - ${statusCode}`);
  console.error(err.stack);
  
  // Отправляем ответ с ошибкой
  res.status(statusCode).json(errorResponse);
}; 