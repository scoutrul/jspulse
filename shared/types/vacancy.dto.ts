export interface VacancyDTO {
  externalId: string;
  title: string;
  company: string;
  location: string;
  schedule?: string;
  description?: string;
  skills: string[];
  salaryFrom?: number;
  salaryTo?: number;
  salaryCurrency?: string;
  url: string;
  publishedAt: string; // Используем строку для DTO, т.к. Date может быть не сериализуемым в JSON напрямую

  // Новые поля для DTO
  experience?: string; 
  employment?: string; 
  address?: string;    
} 