import { Request, Response, NextFunction } from "express";
import { z } from "@jspulse/shared";

/**
 * Типы расположения схемы в запросе
 */
export enum SchemaLocation {
  BODY = "body",
  QUERY = "query",
  PARAMS = "params",
}

/**
 * Middleware для валидации запроса с использованием Zod-схемы
 * @param schema - Zod-схема для валидации
 * @param location - Расположение данных в запросе (body, query, params)
 */
export const validate = (
  schema: z.ZodSchema,
  location: SchemaLocation = SchemaLocation.BODY
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Получаем данные из запроса в зависимости от расположения
      const data = req[location];
      
      // Валидируем данные
      const result = schema.safeParse(data);
      
      if (!result.success) {
        // Форматируем ошибки валидации
        const formattedErrors = result.error.format();
        
        return res.status(400).json({
          success: false,
          error: {
            code: 400,
            message: "Validation Error",
            details: formattedErrors,
          },
        });
      }
      
      // Обновляем данные запроса валидированным результатом
      req[location] = result.data;
      
      next();
    } catch (error) {
      console.error("Ошибка валидации:", error);
      
      return res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: "Internal Validation Error",
          details: error instanceof Error ? error.message : "Unknown validation error",
        },
      });
    }
  };
};

/**
 * Упрощённые хелперы для валидации разных частей запроса
 */
export const validateBody = (schema: z.ZodSchema) => 
  validate(schema, SchemaLocation.BODY);

export const validateQuery = (schema: z.ZodSchema) => 
  validate(schema, SchemaLocation.QUERY);

export const validateParams = (schema: z.ZodSchema) => 
  validate(schema, SchemaLocation.PARAMS); 