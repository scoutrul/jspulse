import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

// Импортируем маршруты из TS файла
import vacancyRoutes from './routes/vacancyRoutes';

dotenv.config(); // Вызываем config()

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URL = process.env.MONGO_URL;

// Проверка MONGO_URL
if (!MONGO_URL) {
  console.error('FATAL ERROR: MONGO_URL is not defined.');
  process.exit(1); // Выход, если нет URL базы данных
}

console.log('Используемый URL MongoDB:', MONGO_URL);

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB подключение
mongoose.connect(MONGO_URL)
  .then(() => console.log('MongoDB подключен'))
  .catch(err => {
    console.error('MongoDB ошибка подключения:', err)
    process.exit(1); // Выход, если не удалось подключиться к БД при старте
  });

// Простой маршрут для проверки работы API
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'API работает' });
});

// Подключаем маршруты для вакансий
// Убедись, что vacancyRoutes экспортирует express.Router
app.use('/api/vacancies', vacancyRoutes);

// 404 маршрут для неизвестных запросов
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ 
    status: 'ERROR', 
    message: 'Запрашиваемый ресурс не найден' 
  });
});

// Обработка ошибок
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    status: 'ERROR', 
    message: 'Внутренняя ошибка сервера',
    // В development можно передавать err.message, в production лучше скрыть
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error' 
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
}); 