import { Request, Response } from 'express';
import { GetUniqueSkillsUseCase } from '../../application/use-cases/GetUniqueSkillsUseCase.js';
import { SkillsResponseDto } from '../../application/dto/SkillsResponseDto.js';

/**
 * Controller для работы с навыками
 * Отвечает только за HTTP логику, делегирует бизнес-логику в Use Cases
 */
export class SkillsController {
  constructor(
    private readonly getUniqueSkillsUseCase: GetUniqueSkillsUseCase
  ) { }

  /**
   * GET /skills - получение уникальных навыков
   */
  async getUniqueSkills(req: Request, res: Response): Promise<void> {
    try {
      // Делегируем бизнес-логику в Use Case
      const skills = await this.getUniqueSkillsUseCase.execute();

      // Создаем DTO для ответа
      const responseDto = SkillsResponseDto.fromSkills(skills);

      // Отправляем ответ
      res.json(responseDto.toApiResponse());
    } catch (error) {
      console.error('Error in SkillsController.getUniqueSkills:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Failed to get unique skills'
        }
      });
    }
  }
}
