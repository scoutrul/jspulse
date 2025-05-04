import { Request, Response, NextFunction } from "express";

/**
 * Middleware для логирования запросов
 * Выводит в консоль метод, URL и время запроса
 */
export const logger = (req: Request, res: Response, next: NextFunction): void => {
  const timestamp = new Date().toISOString();
  const { method, url, ip } = req;
  
  console.log(`[${timestamp}] [${method}] ${url} от ${ip}`);
  
  // Засекаем время выполнения запроса
  const start = Date.now();
  
  // Перехватываем событие завершения запроса
  res.on("finish", () => {
    const responseTime = Date.now() - start;
    console.log(`[${timestamp}] [${method}] ${url} ответ: ${res.statusCode} за ${responseTime}ms`);
  });
  
  next();
}; 