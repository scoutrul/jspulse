import express, { Express, Request, Response, NextFunction } from "express";
import "dotenv/config";
import cors from "cors";
import { connectDB } from "./config/db.js";
import vacancyRoutes from "./routes/vacancyRoutes.js";
import { logger, errorHandler, authGuard, AppError } from "./middleware";

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

// API роуты
app.use("/api/vacancies", vacancyRoutes);

// Обработка несуществующих роутов (404)
app.use("*", (req: Request, res: Response, next: NextFunction) => {
  next(AppError.notFound(`Путь ${req.originalUrl} не найден на сервере`));
});

// Middleware для обработки ошибок всегда должен быть последним
app.use(errorHandler);

// Запуск сервера
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
