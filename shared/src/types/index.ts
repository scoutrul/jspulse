export * from "./core/vacancy.base.js";
export * from "./core/repository.interface.js";
export * from "./core/vacancy-repository.interface.js";
export * from "./core/cache.interface.js";
export * from "./core/di-container.interface.js";

export * from "./db/vacancy.model.js";

export * from "./sources/hh.types.js";
export * from "./sources/telegram.types.js";

export * from "./dto/vacancy.dto.js";
export * from "./dto/api.dto.js";

export * from "./vacancy.types.js";

// Экспортируем дополнительные типы, которые используются в backend
export type { VacancyDTO, VacancyWithHtml, VacancyWithProcessedContent } from "./dto/vacancy.dto.js";
export type { HHVacancyRaw, HHResponseRaw } from "./sources/hh.types.js";
export type { TelegramMessage, TelegramParsingResult, TelegramConfig, TelegramChannelInfo, TelegramParsingStats, TelegramAuthData, SessionData } from "./sources/telegram.types.js";
export { PAGINATION, ARCHIVE } from "../constants/pagination.constants.js"; 