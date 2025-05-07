import express, { Express, Request, Response, NextFunction } from "express";
import "dotenv/config";
import cors from "cors";
import { connectDB } from "./config/db.js";
import vacancyRoutes from "./routes/vacancyRoutes.js";
import { logger, errorHandler, authGuard, AppError } from "./middleware/index.js";

const app: Express = express();

const port = process.env.PORT;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(logger);
app.use(authGuard);

connectDB();

app.get("/", (req: Request, res: Response) => {
  res.send("Backend is running!");
});

app.use("/api/vacancies", vacancyRoutes);

// Обработка ошибок 404 - используем обработчик, который не конфликтует с path-to-regexp
// Избегаем использования динамических параметров в маршрутах со звездочкой
app.use(function (req: Request, res: Response, next: NextFunction) {

  const safeUrl = req.originalUrl.replace(/:/g, '%3A');
  next(AppError.notFound(`Путь ${safeUrl} не найден на сервере`));
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
