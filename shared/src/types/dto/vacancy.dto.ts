// Импортируем тип из схемы Zod
import type { VacancyDTO as ZodVacancyDTO } from "../../schemas/vacancy.schema.js";

// Единый источник истины для DTO вакансии - тип из Zod-схемы
export type VacancyDTO = ZodVacancyDTO;
