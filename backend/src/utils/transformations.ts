// import { parseHTML } from "linkedom"; // Удаляем импорт, если пакет не установлен
import ky, { HTTPError } from "ky";
import type { DescriptionContent } from "../types/DescriptionContent.js";

// Временные локальные типы до исправления shared
interface BaseVacancy {
  externalId: string;
  title: string;
  company: string;
  location: string;
  url: string;
  source: string;
}

interface HHSkill {
  name: string;
}

interface HHVacancyRaw {
  id: string;
  name: string;
  employer?: { name: string };
  area?: { name: string };
  alternate_url: string;
  published_at: string;
  snippet?: {
    responsibility?: string;
    requirement?: string;
  };
  description?: string;
  key_skills?: HHSkill[];
  salary?: {
    from?: number;
    to?: number;
    currency?: string;
  };
  experience?: { name: string };
  employment?: { name: string };
  address?: { raw: string };
}
import { HH_API_BASE_URL } from "../config/api.js";
import { DescriptionService } from "../services/DescriptionService.js";

// Основано на https://github.com/hhru/api/blob/master/docs_eng/vacancies.md

// Константы для источников данных
const SOURCE_HH = "hh.ru";

// Фиксированная длина превью
const PREVIEW_LENGTH = 1200;

/**
 * Интерфейс для полной информации о вакансии с HH.ru
 */
interface HHVacancyFull extends HHVacancyRaw {
  description: string; // Полное HTML описание
  branded_description?: string; // Брендированное описание
}

/**
 * Нормализует строку навыка: удаляет лишние пробелы и приводит к нижнему регистру
 */
function normalizeSkill(skill: string): string {
  return skill.trim().toLowerCase();
}

/**
 * Получает полную информацию о вакансии с HH.ru API
 */
export async function fetchFullVacancyDescription(vacancyId: string): Promise<string | null> {
  try {
    console.log(`🔍 Получаю полное описание для вакансии ${vacancyId}...`);

    const fullVacancy = await ky
      .get(`${HH_API_BASE_URL}/vacancies/${vacancyId}`, {
        headers: {
          "User-Agent": "JSPulse",
          "HH-User-Agent": "JSPulse",
        },
        timeout: 10000,
      })
      .json<HHVacancyFull>();

    if (fullVacancy.description) {
      console.log(`✅ Получено полное описание для вакансии ${vacancyId} (${fullVacancy.description.length} символов)`);
      return fullVacancy.description;
    }

    console.log(`⚠️ Полное описание для вакансии ${vacancyId} отсутствует`);
    return null;
  } catch (error) {
    console.error(`❌ Ошибка при получении полного описания для вакансии ${vacancyId}:`, error);

    if (error instanceof HTTPError) {
      console.error(`📋 Ответ сервера (${error.response.status}):`, await error.response.text());
    }

    return null;
  }
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
  fullDescription?: DescriptionContent;
  processedHtml?: string;
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

  // Обрабатываем описания с помощью DescriptionService
  const processedDescriptions = DescriptionService.processHHVacancyDescription({
    snippet: hhVacancy.snippet,
    description: hhVacancy.description,
    fullDescription: undefined // Будет заполнено позже через API
  }, PREVIEW_LENGTH);

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

    // Дополнительные поля с обработанными описаниями
    description: processedDescriptions.description,
    fullDescription: processedDescriptions.fullDescription,
    processedHtml: processedDescriptions.processedHtml,
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
 * Расширенная трансформация с получением полного описания
 */
export async function transformHHVacancyWithFullDescription(
  hhVacancy: HHVacancyRaw,
  fetchFullDescription: boolean = true
): Promise<ReturnType<typeof transformHHVacancyToIVacancy>> {
  const baseTransform = transformHHVacancyToIVacancy(hhVacancy);

  if (fetchFullDescription && !baseTransform.fullDescription) {
    // Получаем полное описание через отдельный API call
    const fullDescriptionHtml = await fetchFullVacancyDescription(hhVacancy.id);
    if (fullDescriptionHtml) {
      // Обрабатываем полное описание с помощью DescriptionService
      const processedDescriptions = DescriptionService.processHHVacancyDescription({
        snippet: hhVacancy.snippet,
        description: baseTransform.description,
        fullDescription: fullDescriptionHtml
      }, PREVIEW_LENGTH);

      // Обновляем данные с обработанным полным описанием
      baseTransform.fullDescription = processedDescriptions.fullDescription;
      baseTransform.processedHtml = processedDescriptions.processedHtml;
    }
  }

  return baseTransform;
}

/**
 * Очищает HTML от потенциально опасных элементов
 * В будущем, здесь должна быть реализация с использованием DOMPurify или аналога
 */
export function sanitizeHTML(html: string): string {
  // В идеале, здесь должна быть реализация с DOMPurify
  return html;
}
