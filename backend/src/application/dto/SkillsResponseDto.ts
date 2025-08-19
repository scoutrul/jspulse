import { Skill } from '../../domain/entities/Skill.js';

/**
 * DTO для ответа с навыками
 * Отделяет presentation layer от domain entities
 */
export class SkillsResponseDto {
  constructor(
    public readonly skills: string[],
    public readonly count: number,
    public readonly timestamp: Date = new Date()
  ) { }

  /**
   * Создание DTO из domain entities
   */
  static fromSkills(skills: Skill[]): SkillsResponseDto {
    return new SkillsResponseDto(
      skills.map(skill => skill.name),
      skills.length
    );
  }

  /**
   * Создание DTO из сырых данных
   */
  static fromRawSkills(rawSkills: string[]): SkillsResponseDto {
    return new SkillsResponseDto(rawSkills, rawSkills.length);
  }

  /**
   * Преобразование в API ответ
   */
  toApiResponse() {
    return {
      success: true,
      data: this.skills,
      meta: {
        count: this.count,
        timestamp: this.timestamp.toISOString()
      }
    };
  }
}
