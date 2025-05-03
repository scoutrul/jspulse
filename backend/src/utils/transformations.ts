// import { parseHTML } from "linkedom"; // Удаляем импорт, если пакет не установлен
import type { BaseVacancy, HHVacancyRaw, HHSkill } from "@jspulse/shared";

// Основано на https://github.com/hhru/api/blob/master/docs_eng/vacancies.md

// Константы для источников данных
const SOURCE_HH = "hh.ru";

/**
 * Нормализует строку навыка: удаляет лишние пробелы и приводит к нижнему регистру
 */
function normalizeSkill(skill: string): string {
  return skill.trim().toLowerCase();
}

/**
 * Трансформирует данные из HeadHunter API в наш формат вакансии
 */
export function transformHHVacancyToIVacancy(hhVacancy: HHVacancyRaw): Omit<
  BaseVacancy,
  "publishedAt"
> & {
  skills: string[];
  description?: string;
  salaryFrom?: number;
  salaryTo?: number;
  salaryCurrency?: string;
  experience?: string;
  employment?: string;
  address?: string;
  publishedAt: Date;
  rawData: any;
} {
  // Получаем навыки (skills) из hhVacancy.key_skills и нормализуем их
  const skills = hhVacancy.key_skills
    ? hhVacancy.key_skills.map((skill: HHSkill) => normalizeSkill(skill.name))
    : [];

  // Формируем описание из разных источников (предпочитая полное описание)
  const description =
    hhVacancy.description ??
    hhVacancy.snippet?.responsibility ??
    hhVacancy.snippet?.requirement ??
    "Описание отсутствует";

  // Приводим данные к нашему формату
  const transformed = {
    // Базовые поля
    externalId: hhVacancy.id,
    title: hhVacancy.name,
    company: hhVacancy.employer?.name || "Неизвестная компания",
    location: hhVacancy.area?.name || "Неизвестное местоположение",
    url: hhVacancy.alternate_url,
    publishedAt: new Date(hhVacancy.published_at),
    source: SOURCE_HH,

    // Дополнительные поля
    description,
    skills,
    salaryFrom: hhVacancy.salary?.from ?? undefined,
    salaryTo: hhVacancy.salary?.to ?? undefined,
    salaryCurrency: hhVacancy.salary?.currency ?? undefined,
    experience: hhVacancy.experience?.name,
    employment: hhVacancy.employment?.name,
    address: hhVacancy.address?.raw,

    // Сохраняем исходные данные
    rawData: hhVacancy,
  };

  return transformed;
}

/**
 * Очищает HTML от потенциально опасных элементов
 * В будущем, здесь должна быть реализация с использованием DOMPurify или аналога
 */
export function sanitizeHTML(html: string): string {
  // В идеале, здесь должна быть реализация с DOMPurify
  return html;
}
