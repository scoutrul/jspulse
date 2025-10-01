import { Vacancy } from '../entities/Vacancy.js';

/**
 * Сервис для перемешивания вакансий по источникам
 * Предотвращает отображение более 2 вакансий подряд из одного источника
 */
export class VacancyShufflingService {
  private readonly maxConsecutiveFromSameSource: number;

  constructor(maxConsecutiveFromSameSource: number = 2) {
    this.maxConsecutiveFromSameSource = maxConsecutiveFromSameSource;
  }

  /**
   * Перемешивает вакансии по источникам, группируя по дате
   * @param vacancies - массив вакансий для перемешивания
   * @returns перемешанный массив вакансий
   */
  shuffleVacanciesBySource(vacancies: Vacancy[]): Vacancy[] {
    if (vacancies.length <= 1) {
      return vacancies;
    }

    // Группируем вакансии по дате (только дата, без времени)
    const groupedByDate = this.groupVacanciesByDate(vacancies);

    // Перемешиваем каждую группу по дате
    const shuffledGroups = Object.entries(groupedByDate)
      .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime()) // Сортируем по убыванию даты
      .map(([date, dayVacancies]) => ({
        date,
        shuffled: this.shuffleDayVacancies(dayVacancies)
      }));

    // Объединяем все группы, сохраняя порядок по дате
    return shuffledGroups.flatMap(group => group.shuffled);
  }

  /**
   * Группирует вакансии по дате публикации (без времени)
   */
  private groupVacanciesByDate(vacancies: Vacancy[]): Record<string, Vacancy[]> {
    const groups: Record<string, Vacancy[]> = {};

    for (const vacancy of vacancies) {
      const dateKey = vacancy.publishedAt.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }

      groups[dateKey].push(vacancy);
    }

    return groups;
  }

  /**
   * Перемешивает вакансии в рамках одного дня
   */
  private shuffleDayVacancies(vacancies: Vacancy[]): Vacancy[] {
    if (vacancies.length <= 1) {
      return vacancies;
    }

    // Группируем по источникам
    const sourceGroups = this.groupVacanciesBySource(vacancies);
    const sources = Object.keys(sourceGroups);

    // Если только один источник, возвращаем как есть
    if (sources.length <= 1) {
      return vacancies;
    }

    // Применяем алгоритм round-robin с ограничением на последовательность
    return this.roundRobinShuffleWithLimit(sourceGroups, sources);
  }

  /**
   * Группирует вакансии по источнику
   */
  private groupVacanciesBySource(vacancies: Vacancy[]): Record<string, Vacancy[]> {
    const groups: Record<string, Vacancy[]> = {};

    for (const vacancy of vacancies) {
      const source = vacancy.source || 'unknown';

      if (!groups[source]) {
        groups[source] = [];
      }

      groups[source].push(vacancy);
    }

    return groups;
  }

  /**
   * Round-robin перемешивание с ограничением на количество подряд идущих из одного источника
   */
  private roundRobinShuffleWithLimit(
    sourceGroups: Record<string, Vacancy[]>,
    sources: string[]
  ): Vacancy[] {
    const result: Vacancy[] = [];
    const sourceQueues = { ...sourceGroups };
    let consecutiveCount = 0;
    let lastSource = '';

    // Пока есть вакансии в любом из источников
    while (this.hasVacancies(sourceQueues)) {
      // Если достигли лимита последовательных из одного источника, переключаемся
      if (consecutiveCount >= this.maxConsecutiveFromSameSource && lastSource) {
        // Ищем другой источник с вакансиями
        const alternativeSource = sources.find(source =>
          source !== lastSource && sourceQueues[source] && sourceQueues[source].length > 0
        );

        if (alternativeSource) {
          const vacancy = sourceQueues[alternativeSource]!.shift()!;
          result.push(vacancy);
          lastSource = alternativeSource;
          consecutiveCount = 1;
          continue;
        }
      }

      // Ищем источник с вакансиями
      const currentSource = sources.find(source =>
        sourceQueues[source] && sourceQueues[source].length > 0
      );

      if (!currentSource) {
        break;
      }

      const vacancy = sourceQueues[currentSource]!.shift()!;
      result.push(vacancy);

      // Обновляем счетчик последовательных
      if (currentSource === lastSource) {
        consecutiveCount++;
      } else {
        consecutiveCount = 1;
        lastSource = currentSource;
      }
    }

    return result;
  }

  /**
   * Проверяет, есть ли вакансии в любом из источников
   */
  private hasVacancies(sourceQueues: Record<string, Vacancy[]>): boolean {
    return Object.values(sourceQueues).some(queue => queue.length > 0);
  }
}
