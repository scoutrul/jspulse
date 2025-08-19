/**
 * Базовый интерфейс для всех Use Cases
 * Следует принципу Command Pattern
 */
export interface IUseCase<TRequest = void, TResponse = void> {
  execute(request?: TRequest): Promise<TResponse>;
}

/**
 * Интерфейс для Use Cases без параметров
 */
export interface IUseCaseWithoutParams<TResponse = void> {
  execute(): Promise<TResponse>;
}

/**
 * Интерфейс для Use Cases с параметрами
 */
export interface IUseCaseWithParams<TRequest, TResponse = void> {
  execute(request: TRequest): Promise<TResponse>;
}
