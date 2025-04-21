import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../config/api.config';

const baseConfig: AxiosRequestConfig = {
  baseURL: API_CONFIG.BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// Создаем экземпляр для внутреннего API
export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Создаем экземпляр для HeadHunter API
export const hhClient: AxiosInstance = axios.create({
  ...baseConfig,
  baseURL: API_CONFIG.HH_API.BASE_URL,
  headers: {
    ...baseConfig.headers,
    'User-Agent': 'JS-Pulse-App'
  }
});

apiClient.interceptors.response.use(
  response => response.data,
  error => Promise.reject(error)
);

hhClient.interceptors.response.use(
  response => response.data,
  error => Promise.reject(error)
);
