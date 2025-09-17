// src/api/client.ts
// Axios-Client für matbakh.app – ohne Supabase, mit Cognito (aws-amplify/auth)

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

/** Bevorzugte Base-URL-Reihenfolge */
const baseURL =
  import.meta.env.VITE_PUBLIC_API_BASE ||
  import.meta.env.VITE_API_BASE_URL ||
  'https://api.matbakh.app';

/** Standardisierte API-Response */
export interface APIResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
  meta?: {
    pagination?: PaginationMeta;
    timestamp?: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface APIError {
  code: string;
  message: string;
  status: number;
  details?: any;
  retryable: boolean;
}

/** Extra Request-Flags */
export interface RequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  retries?: number;
  cache?: boolean;
}

/** Hauptklasse */
class APIClient {
  private axiosInstance: AxiosInstance;
  private requestCache = new Map<string, Promise<any>>();
  private retryAttempts = new Map<string, number>();

  constructor() {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.axiosInstance.interceptors.request.use(
      this.requestInterceptor.bind(this),
      this.requestErrorInterceptor.bind(this)
    );

    this.axiosInstance.interceptors.response.use(
      this.responseInterceptor.bind(this),
      this.responseErrorInterceptor.bind(this)
    );
  }

  /** Auth-Header via Cognito hinzufügen (falls nötig) */
  private async requestInterceptor(
    config: InternalAxiosRequestConfig
  ): Promise<InternalAxiosRequestConfig> {
    if (config.skipAuth || this.isPublicEndpoint(config.url || '')) {
      // Öffentliche Endpunkte ohne Token
      return config;
    }

    try {
      const session = await fetchAuthSession(); // Amplify aktualisiert Tokens bei Bedarf selbst
      const token = session?.tokens?.accessToken?.toString();

      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      // kein hartes Fail – Server entscheidet über 401
      console.warn('Auth header konnte nicht gesetzt werden:', err);
    }

    // Request-ID für Debug/Tracing
    config.headers = config.headers || {};
    if (!config.headers['X-Request-ID']) {
      config.headers['X-Request-ID'] = this.generateRequestId();
    }

    return config;
  }

  private requestErrorInterceptor(error: any): Promise<never> {
    console.error('Request-Interceptor-Fehler:', error);
    return Promise.reject(this.createAPIError(error));
  }

  private responseInterceptor(response: AxiosResponse): AxiosResponse {
    const reqId = this.getRequestId(response.config);
    if (reqId) this.retryAttempts.delete(reqId);
    return response;
  }

  private async responseErrorInterceptor(error: AxiosError): Promise<any> {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (!original) return Promise.reject(this.createAPIError(error));

    // Retry-Politik: Netzwerkfehler / 5xx / 429
    if (this.shouldRetry(error, original)) {
      const requestId = this.getRequestId(original);
      const attempts = this.retryAttempts.get(requestId) || 0;
      const max = original.retries ?? 3;

      if (attempts < max) {
        this.retryAttempts.set(requestId, attempts + 1);
        const delayMs = Math.min(1000 * 2 ** attempts, 10000);
        await this.delay(delayMs);
        return this.axiosInstance(original);
      }
    }

    return Promise.reject(this.createAPIError(error));
  }

  /** Öffentliche Endpunkte (ohne Auth) */
  private isPublicEndpoint(url: string): boolean {
    const publicEndpoints = [
      '/health',
      '/status',
      '/vc/quick',
      '/auth/', // Auth-Flows
    ];
    return publicEndpoints.some((p) => url.includes(p));
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  private getRequestId(config: InternalAxiosRequestConfig): string {
    return (config.headers?.['X-Request-ID'] as string) || '';
  }

  private shouldRetry(error: AxiosError, config: InternalAxiosRequestConfig): boolean {
    if (config.retries === 0) return false;
    if (!error.response) return true; // Netzwerkfehler
    const status = error.response.status;
    return status >= 500 || status === 429;
  }

  private createAPIError(error: AxiosError): APIError {
    const status = error.response?.status ?? 0;
    const data = error.response?.data as any;
    return {
      code: data?.code || error.code || 'UNKNOWN_ERROR',
      message: data?.message || error.message || 'Unknown error',
      status,
      details: data || error,
      retryable: this.shouldRetry(error, error.config as InternalAxiosRequestConfig),
    };
  }

  private delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // ========= Convenience-Methoden =========

  async get<T = any>(endpoint: string, config?: RequestConfig): Promise<APIResponse<T>> {
    const key = `GET:${endpoint}:${JSON.stringify(config)}`;
    if (config?.cache && this.requestCache.has(key)) return this.requestCache.get(key)!;

    const p = this.axiosInstance.get<APIResponse<T>>(endpoint, config).then((r) => r.data);
    if (config?.cache) {
      this.requestCache.set(key, p);
      p.finally(() => this.requestCache.delete(key));
    }
    return p;
  }

  async post<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<APIResponse<T>> {
    const res = await this.axiosInstance.post<APIResponse<T>>(endpoint, data, config);
    return res.data;
  }

  async put<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<APIResponse<T>> {
    const res = await this.axiosInstance.put<APIResponse<T>>(endpoint, data, config);
    return res.data;
  }

  async patch<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<APIResponse<T>> {
    const res = await this.axiosInstance.patch<APIResponse<T>>(endpoint, data, config);
    return res.data;
  }

  async delete<T = any>(endpoint: string, config?: RequestConfig): Promise<APIResponse<T>> {
    const res = await this.axiosInstance.delete<APIResponse<T>>(endpoint, config);
    return res.data;
  }

  async upload<T = any>(
    endpoint: string,
    file: File,
    onProgress?: (p: number) => void,
    config?: RequestConfig
  ): Promise<APIResponse<T>> {
    const form = new FormData();
    form.append('file', file);
    const uploadCfg: RequestConfig = {
      ...config,
      headers: { 'Content-Type': 'multipart/form-data', ...(config?.headers || {}) },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      },
    };
    const res = await this.axiosInstance.post<APIResponse<T>>(endpoint, form, uploadCfg);
    return res.data;
  }

  clearCache() {
    this.requestCache.clear();
  }

  getAxiosInstance() {
    return this.axiosInstance;
  }
}

/** Singleton */
const apiClient = new APIClient();
export default apiClient;

/** Helper: Healthcheck */
export const healthCheck = () => apiClient.get('/health');
