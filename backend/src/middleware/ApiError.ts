import { ApiError } from "./errorHandler";

/**
 * Класс для создания стандартизированных API ошибок
 */
export class AppError implements ApiError {
  name: string;
  message: string;
  statusCode: number;
  details?: unknown;
  stack?: string;

  constructor(message: string, statusCode = 500, details?: unknown) {
    this.name = "ApiError";
    this.message = message;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Создание ошибки 400 Bad Request
   */
  static badRequest(message = "Некорректный запрос", details?: unknown): AppError {
    return new AppError(message, 400, details);
  }

  /**
   * Создание ошибки 401 Unauthorized
   */
  static unauthorized(message = "Требуется авторизация", details?: unknown): AppError {
    return new AppError(message, 401, details);
  }

  /**
   * Создание ошибки 403 Forbidden
   */
  static forbidden(message = "Доступ запрещен", details?: unknown): AppError {
    return new AppError(message, 403, details);
  }

  /**
   * Создание ошибки 404 Not Found
   */
  static notFound(message = "Ресурс не найден", details?: unknown): AppError {
    return new AppError(message, 404, details);
  }

  /**
   * Создание ошибки 409 Conflict
   */
  static conflict(message = "Конфликт данных", details?: unknown): AppError {
    return new AppError(message, 409, details);
  }

  /**
   * Создание ошибки 422 Unprocessable Entity
   */
  static validationError(message = "Ошибка валидации", details?: unknown): AppError {
    return new AppError(message, 422, details);
  }

  /**
   * Создание ошибки 500 Internal Server Error
   */
  static internal(message = "Внутренняя ошибка сервера", details?: unknown): AppError {
    return new AppError(message, 500, details);
  }
} 