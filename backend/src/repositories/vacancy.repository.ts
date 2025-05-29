export interface IVacancyRepository {
  findAll(params: VacancyQueryParams): Promise<IVacancy[]>;
  findById(id: string): Promise<IVacancy | null>;
  create(vacancy: CreateVacancyDTO): Promise<IVacancy>;
}

export class VacancyRepository implements IVacancyRepository {
  // Абстрагируем работу с MongoDB от бизнес-логики
  // Упрощает тестирование и смену источника данных
}