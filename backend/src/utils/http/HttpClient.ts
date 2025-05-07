
export interface HttpRequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string>;
  timeout?: number;
  retry?: number;
  [key: string]: unknown;
}


export interface HttpClient {

  get<T>(url: string, options?: HttpRequestOptions): Promise<T>;


  post<T>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<T>;


  put<T>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<T>;


  patch<T>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<T>;


  delete<T>(url: string, options?: HttpRequestOptions): Promise<T>;
} 