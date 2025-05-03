export * from "./db/vacancy.model.js";
export * from "./core/vacancy.base.js";
export * from "./sources/hh.types.js";
export * from "./dto/vacancy.dto.js";
export * from "./dto/api.dto.js";
export * from "./vacancy.types.js";
export interface PaginatedResponse<T> {
    status: "OK" | "ERROR";
    data: {
        items: T[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    } | null;
    message?: string;
}
import { VacancyDTO } from "./dto/vacancy.dto.js";
export type PaginatedVacanciesResponse = PaginatedResponse<VacancyDTO>;
