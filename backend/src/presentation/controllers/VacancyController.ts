import { Request, Response } from 'express';
import { GetVacanciesUseCase } from '../../application/use-cases/GetVacanciesUseCase.js';
import { GetVacancyByIdUseCase } from '../../application/use-cases/GetVacancyByIdUseCase.js';
import { GetSkillsUseCase } from '../../application/use-cases/GetSkillsUseCase.js';
import { GetSkillsStatsUseCase } from '../../application/use-cases/GetSkillsStatsUseCase.js';

/**
 * Controller для работы с вакансиями
 * Отвечает только за HTTP логику, делегирует бизнес-логику в Use Cases
 */
export class VacancyController {
  constructor(
    private readonly getVacanciesUseCase: GetVacanciesUseCase,
    private readonly getVacancyByIdUseCase: GetVacancyByIdUseCase,
    private readonly getSkillsUseCase: GetSkillsUseCase,
    private readonly getSkillsStatsUseCase: GetSkillsStatsUseCase
  ) { }

  /**
   * GET /vacancies - получение списка вакансий с фильтрацией
   */
  async getVacancies(req: Request, res: Response): Promise<void> {
    try {
      const { page = 0, limit = 10, skills = '', location = '', experience = '', employment = '', source = '' } = req.query;

      const request = {
        page: Number(page),
        limit: Number(limit),
        skills: skills ? String(skills).split(',').map(s => s.trim()).filter(Boolean) : [],
        location: String(location),
        experience: String(experience),
        employment: String(employment),
        source: String(source)
      };

      const result = await this.getVacanciesUseCase.execute(request);

      res.json(result); // Возвращаем результат напрямую, так как он уже в правильном формате
    } catch (error) {
      console.error('Error in VacancyController.getVacancies:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Internal server error'
        }
      });
    }
  }

  /**
   * GET /vacancies/:id - получение вакансии по ID
   */
  async getVacancyById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.getVacancyByIdUseCase.execute({ id });

      if (!result.vacancy) {
        res.status(404).json({
          success: false,
          error: {
            code: 404,
            message: 'Vacancy not found'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: result.vacancy
      });
    } catch (error) {
      console.error('Error in VacancyController.getVacancyById:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Internal server error'
        }
      });
    }
  }

  async getSkills(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.getSkillsUseCase.execute();
      res.json(result);
    } catch (error) {
      console.error('Error in VacancyController.getSkills:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Internal server error'
        }
      });
    }
  }

  async getSkillsStats(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.getSkillsStatsUseCase.execute();
      res.json(result);
    } catch (error) {
      console.error('Error in VacancyController.getSkillsStats:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 500,
          message: 'Internal server error'
        }
      });
    }
  }
}
