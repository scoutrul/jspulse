import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db.js";
import vacancyRoutes from "./routes/vacancyRoutes.js";

// Загрузка переменных окружения
dotenv.config();

const app: Express = express();

const port = process.env.PORT;

// Middleware
app.use(cors()); // Разрешаем CORS-запросы (настройте более строго для продакшена)
app.use(express.json()); // Для парсинга JSON-тел запросов

connectDB();

// Простой тестовый роут
app.get("/", (req: Request, res: Response) => {
  res.send("Backend is running!");
});

// TODO: Подключить основные роуты приложения (например, для вакансий)
// import vacancyRoutes from './routes/vacancyRoutes'; // Предполагаемый путь
// app.use('/api/vacancies', vacancyRoutes);

// Application Routes
// TODO: Connect main application routes
app.use("/api/vacancies", vacancyRoutes); // Подключаем маршруты вакансий

// Запуск сервера
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
