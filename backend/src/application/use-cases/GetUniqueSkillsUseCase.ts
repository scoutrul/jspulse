import { IUseCaseWithoutParams } from '../interfaces/IUseCase.js';
import { IVacancyRepository } from '../../domain/repositories/IVacancyRepository.js';
import { Skill } from '../../domain/entities/Skill.js';

/**
 * Use Case для получения уникальных навыков
 * Координирует получение данных и преобразование в domain entities
 */
export class GetUniqueSkillsUseCase implements IUseCaseWithoutParams<Skill[]> {
  constructor(
    private readonly vacancyRepository: IVacancyRepository
  ) { }

  async execute(): Promise<Skill[]> {
    try {
      // Получаем сырые данные из репозитория
      const rawSkills = await this.vacancyRepository.getUniqueSkills();

      // Преобразуем в domain entities
      const skills = rawSkills.map(skillName => new Skill(skillName));

      // Сортируем по алфавиту
      return skills.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error in GetUniqueSkillsUseCase:', error);
      throw new Error('Failed to get unique skills');
    }
  }
}
