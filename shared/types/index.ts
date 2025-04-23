// shared/types/index.ts

// Экспорт базовых типов
export * from "./core/vacancy.base";

// Экспорт типов для источников API
export * from "./sources/hh.types";
// export * from './sources/vc.types'; // Пример для будущего

// Экспорт типа для модели БД
export * from "./db/vacancy.model";

// Экспорт типа DTO для API
export * from "./dto/vacancy.dto";
export * from "./dto/api.dto";

// Экспорт типов окружения (если нужен глобально)
// export * from './env.d';

// Старые экспорты (могут быть нужны временно или для обратной совместимости, но лучше удалить)
// export * from './vacancy.dto';
// export * from './hh.types';
