import { Request, Response, NextFunction } from "express";
import { AppError } from "./ApiError";

/**
 * Типы расположения данных для валидации
 */
type ValidateSource = "body" | "query" | "params";

/**
 * Интерфейс для любой валидационной схемы
 * Это позволит использовать разные валидаторы (Joi, Zod, Yup и др.)
 */
interface ValidationSchema {
  validate(data: unknown): { 
    error?: { 
      message?: string;
      details?: Array<{ message: string }>;
    };
    value: unknown;
  };
}

/**
 * Создает middleware для валидации данных запроса
 * @param schema Схема валидации
 * @param source Откуда брать данные для валидации (body, query, params)
 */
export const validate = (schema: ValidationSchema, source: ValidateSource = "body") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const data = req[source];
    
    const { error, value } = schema.validate(data);
    
    if (error) {
      // Формируем детальное сообщение об ошибке
      const details = error.details?.map(detail => detail.message) || [];
      
      // Создаем и выбрасываем ошибку валидации
      throw AppError.validationError(
        error.message || "Ошибка валидации данных", 
        details.length ? details : undefined
      );
    }
    
    // Если валидация прошла успешно, заменяем данные в запросе 
    // на нормализованные значения из валидатора
    req[source] = value;
    
    next();
  };
}; 