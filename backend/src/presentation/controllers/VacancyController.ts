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
      const { page = 0, limit = 10, skills = '', location = '', experience = '', employment = '', source = '', sources = '', showUnvisited = false } = req.query;

      // Поддержка как одиночного 'source', так и множественного 'sources' (comma-separated)
      const sourcesArray = (() => {
        const fromSources = sources ? String(sources).split(',').map(s => s.trim()).filter(Boolean) : [];
        const fromSource = source ? [String(source).trim()] : [];
        const merged = Array.from(new Set([...fromSources, ...fromSource])).filter(Boolean);
        return merged;
      })();

      const request = {
        page: Number(page),
        limit: Number(limit),
        skills: skills ? String(skills).split(',').map(s => s.trim()).filter(Boolean) : [],
        location: String(location),
        experience: String(experience),
        employment: String(employment),
        // Оставляем старое поле для обратной совместимости (не используется в use-case)
        source: String(source),
        sources: sourcesArray,
        showUnvisited: showUnvisited === 'true'
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

  /**
   * PATCH /vacancies/:id/visit - отметка вакансии как посещенной
   */
  async markAsVisited(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Импортируем модель напрямую для простоты
      const { Vacancy } = await import('../../models/Vacancy.js');

      const result = await Vacancy.findByIdAndUpdate(
        id,
        { visited: true },
        { new: true }
      );

      if (!result) {
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
        data: {
          id: result._id,
          visited: result.visited
        }
      });
    } catch (error) {
      console.error('Error in VacancyController.markAsVisited:', error);
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
