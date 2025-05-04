import express, { Express, Request, Response, NextFunction } from "express";
import "dotenv/config";
import cors from "cors";
import { connectDB } from "./config/db.js";
import vacancyRoutes from "./routes/vacancyRoutes.js";
import { logger, errorHandler, authGuard, AppError } from "./middleware/index.js";

const app: Express = express();

const port = process.env.PORT;

// Основные middleware
app.use(cors()); // Разрешаем CORS-запросы (настройте более строго для продакшена)
app.use(express.json()); // Для парсинга JSON-тел запросов

// Подключаем свои middleware
app.use(logger); // Логирование запросов
app.use(authGuard); // Проверка авторизации, если есть

connectDB();

// Простой тестовый роут
app.get("/", (req: Request, res: Response) => {
  res.send("Backend is running!");
});

// API роуты - используем конкретный путь для решения проблемы с path-to-regexp
app.use("/api/vacancies", vacancyRoutes);

// Обработка ошибок 404 - используем обработчик, который не конфликтует с path-to-regexp
// Избегаем использования динамических параметров в маршрутах со звездочкой
app.use(function (req: Request, res: Response, next: NextFunction) {
  // Создаем безопасную версию URL для сообщения об ошибке
  const safeUrl = req.originalUrl.replace(/:/g, '%3A');
  next(AppError.notFound(`Путь ${safeUrl} не найден на сервере`));
});

// Middleware для обработки ошибок всегда должен быть последним
app.use(errorHandler);

// Запуск сервера
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
