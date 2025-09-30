import { Vacancy } from '../entities/Vacancy.js';
import { Skill } from '../entities/Skill.js';
import { containsBackendStopWords } from '../../config/backendStopWords.js';

/**
 * Domain Service для вакансий
 * Содержит бизнес-логику, которая не принадлежит конкретной вакансии
 */
export class VacancyDomainService {

  /**
   * Фильтрация вакансий по навыкам
   */
  filterBySkills(vacancies: Vacancy[], skillNames: string[]): Vacancy[] {
    return vacancies.filter(vacancy =>
      skillNames.some(skillName => vacancy.hasSkill(skillName))
    );
  }

  /**
   * Фильтрация по диапазону зарплат
   */
  filterBySalaryRange(
    vacancies: Vacancy[],
    minSalary?: number,
    maxSalary?: number
  ): Vacancy[] {
    return vacancies.filter(vacancy => {
      const avgSalary = vacancy.salary.average;
      if (!avgSalary) return false;

      if (minSalary !== undefined && avgSalary < minSalary) return false;
      if (maxSalary !== undefined && avgSalary > maxSalary) return false;

      return true;
    });
  }

  /**
   * Фильтрация по источнику
   */
  filterBySource(vacancies: Vacancy[], sources: string[]): Vacancy[] {
    if (sources.length === 0) return vacancies;

    return vacancies.filter(vacancy =>
      sources.includes(vacancy.source)
    );
  }

  /**
   * Фильтрация вакансий по стоп-словам технологий бэкенда (кроме Node.js)
   * Исключает вакансии, которые содержат технологии, не относящиеся к JavaScript/TypeScript экосистеме
   */
  filterByBackendStopWords(vacancies: Vacancy[]): Vacancy[] {
    return vacancies.filter(vacancy => {
      const vacancyText = `${vacancy.title} ${vacancy.description || ''}`.toLowerCase();
      return !containsBackendStopWords(vacancyText);
    });
  }

  /**
   * Фильтрация по дате публикации
   */
  filterByDateRange(
    vacancies: Vacancy[],
    fromDate?: Date,
    toDate?: Date
  ): Vacancy[] {
    return vacancies.filter(vacancy => {
      const publishedAt = vacancy.publishedAt;

      if (fromDate && publishedAt < fromDate) return false;
      if (toDate && publishedAt > toDate) return false;

      return true;
    });
  }

  /**
   * Фильтрация только активных вакансий
   */
  filterActive(vacancies: Vacancy[]): Vacancy[] {
    return vacancies.filter(vacancy => vacancy.isActive());
  }

  /**
   * Фильтрация только архивных вакансий
   */
  filterArchived(vacancies: Vacancy[]): Vacancy[] {
    return vacancies.filter(vacancy => !vacancy.isActive());
  }

  /**
   * Фильтрация по формату работы
   */
  filterByWorkFormat(vacancies: Vacancy[], format: 'remote' | 'office' | 'hybrid'): Vacancy[] {
    switch (format) {
      case 'remote':
        return vacancies.filter(vacancy => vacancy.isRemote());
      case 'office':
        return vacancies.filter(vacancy => vacancy.isOffice());
      case 'hybrid':
        return vacancies.filter(vacancy => !vacancy.isRemote() && !vacancy.isOffice());
      default:
        return vacancies;
    }
  }

  /**
   * Сортировка вакансий
   */
  sortVacancies(
    vacancies: Vacancy[],
    sortBy: 'publishedAt' | 'salary' | 'title' | 'company',
    direction: 'asc' | 'desc' = 'desc'
  ): Vacancy[] {
    const sorted = [...vacancies];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'publishedAt':
          comparison = a.publishedAt.getTime() - b.publishedAt.getTime();
          break;
        case 'salary':
          const avgA = a.salary.average || 0;
          const avgB = b.salary.average || 0;
          comparison = avgA - avgB;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'company':
          comparison = a.company.name.localeCompare(b.company.name);
          break;
      }

      return direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }

  /**
   * Группировка вакансий по навыкам
   */
  groupBySkills(vacancies: Vacancy[]): Map<string, Vacancy[]> {
    const grouped = new Map<string, Vacancy[]>();

    vacancies.forEach(vacancy => {
      vacancy.skills.forEach(skill => {
        const skillName = skill.name;
        if (!grouped.has(skillName)) {
          grouped.set(skillName, []);
        }
        grouped.get(skillName)!.push(vacancy);
      });
    });

    return grouped;
  }

  /**
   * Группировка вакансий по компании
   */
  groupByCompany(vacancies: Vacancy[]): Map<string, Vacancy[]> {
    const grouped = new Map<string, Vacancy[]>();

    vacancies.forEach(vacancy => {
      const companyName = vacancy.company.name;
      if (!grouped.has(companyName)) {
        grouped.set(companyName, []);
      }
      grouped.get(companyName)!.push(vacancy);
    });

    return grouped;
  }

  /**
   * Расчет статистики по вакансиям
   */
  calculateStatistics(vacancies: Vacancy[]): {
    total: number;
    active: number;
    archived: number;
    highSalary: number;
    remote: number;
    office: number;
    bySource: Map<string, number>;
    bySkills: Map<string, number>;
    averageSalary: number;
  } {
    const bySource = new Map<string, number>();
    const bySkills = new Map<string, number>();
    let totalSalary = 0;
    let salaryCount = 0;

    vacancies.forEach(vacancy => {
      // Подсчет по источнику
      const source = vacancy.source;
      bySource.set(source, (bySource.get(source) || 0) + 1);

      // Подсчет по навыкам
      vacancy.skills.forEach(skill => {
        const skillName = skill.name;
        bySkills.set(skillName, (bySkills.get(skillName) || 0) + 1);
      });

      // Подсчет зарплат
      if (vacancy.salary.average) {
        totalSalary += vacancy.salary.average;
        salaryCount++;
      }
    });

    return {
      total: vacancies.length,
      active: vacancies.filter(v => v.isActive()).length,
      archived: vacancies.filter(v => !v.isActive()).length,
      highSalary: vacancies.filter(v => v.isHighSalary()).length,
      remote: vacancies.filter(v => v.isRemote()).length,
      office: vacancies.filter(v => v.isOffice()).length,
      bySource,
      bySkills,
      averageSalary: salaryCount > 0 ? Math.round(totalSalary / salaryCount) : 0
    };
  }

  /**
   * Поиск вакансий по тексту
   */
  searchByText(vacancies: Vacancy[], searchText: string): Vacancy[] {
    if (!searchText || searchText.trim().length === 0) return vacancies;

    const normalizedSearch = searchText.toLowerCase().trim();

    return vacancies.filter(vacancy => {
      // Поиск по заголовку
      if (vacancy.title.toLowerCase().includes(normalizedSearch)) return true;

      // Поиск по компании
      if (vacancy.company.name.toLowerCase().includes(normalizedSearch)) return true;

      // Поиск по описанию
      if (vacancy.description?.toLowerCase().includes(normalizedSearch)) return true;

      // Поиск по навыкам
      if (vacancy.skills.some(skill => skill.matches(normalizedSearch))) return true;

      return false;
    });
  }
}
