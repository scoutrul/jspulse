import { IVacancy } from "@jspulse/shared";

export interface IVacancyRepository {
  findAll(params: Record<string, unknown>): Promise<IVacancy[]>;
  findById(id: string): Promise<IVacancy | null>;
  create(vacancy: Partial<IVacancy>): Promise<IVacancy>;
}

export class VacancyRepository implements IVacancyRepository {
  findAll(params: Record<string, unknown>): Promise<IVacancy[]> {
    throw new Error("Method not implemented.");
  }
  findById(id: string): Promise<IVacancy | null> {
    throw new Error("Method not implemented.");
  }
  create(vacancy: Partial<IVacancy>): Promise<IVacancy> {
    throw new Error("Method not implemented.");
  }
  // Абстрагируем работу с MongoDB от бизнес-логики
  // Упрощает тестирование и смену источника данных
}