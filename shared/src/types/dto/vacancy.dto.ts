// Импортируем тип из схемы Zod
import type { VacancyDTO as ZodVacancyDTO } from "../../schemas/vacancy.schema.js";
import type { DescriptionContent } from "../db/vacancy.model.js";

// Единый источник истины для DTO вакансии - тип из Zod-схемы
export type VacancyDTO = ZodVacancyDTO;

// Расширенный тип вакансии с HTML-описанием для фронтенда
export type VacancyWithHtml = VacancyDTO & {
  htmlDescription?: string; // Краткое HTML описание
  fullHtmlDescription?: string; // Полное HTML описание
};

// Тип для вакансии с обработанным контентом описания
export type VacancyWithProcessedContent = VacancyDTO & {
  descriptionContent?: DescriptionContent;
};
