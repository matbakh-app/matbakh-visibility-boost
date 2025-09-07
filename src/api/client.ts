/**
 * API Client for matbakh.app
 * Phase A3.2 - Cognito Auth Integration
 * 
 * Axios-based API client with automatic authentication header injection
 * and error handling for AWS API Gateway endpoints
 */

import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  AxiosError,
  InternalAxiosRequestConfig
} from 'axios';
import { createClient } from '@supabase/supabase-js';

// Use existing Supabase client instead of Amplify
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uheksobnyedarrpgxhju.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// API Response types
export interface APIResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
  meta?: {
    pagination?: PaginationMeta;
    timestamp: string;
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

// Request configuration interface
export interface RequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
  retries?: number;
  cache?: boolean;
}

/**
 * API Client class with authentication and error handling
 */
class APIClient {
  private axiosInstance: AxiosInstance;
  private requestCache = new Map<string, Promise<any>>();
  private retryAttempts = new Map<string, number>();

  constructor() {
    const baseURL = import.meta.env.VITE_PUBLIC_API_BASE || 'https://api.matbakh.app';
    
    // Create axios instance with base configuration
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Set up request interceptor for authentication
    this.axiosInstance.interceptors.request.use(
      this.requestInterceptor.bind(this),
      this.requestErrorInterceptor.bind(this)
    );

    // Set up response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      this.responseInterceptor.bind(this),
      this.responseErrorInterceptor.bind(this)
    );
  }

  /**
   * Request interceptor - adds authentication headers
   */
  private async requestInterceptor(
    config: InternalAxiosRequestConfig
  ): Promise<InternalAxiosRequestConfig> {
    // Skip auth for certain endpoints or if explicitly disabled
    if (config.skipAuth || this.isPublicEndpoint(config.url || '')) {
      return config;
    }

    try {
      // Get current session and add auth header
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      
      // Add request ID for tracking
      config.headers['X-Request-ID'] = this.generateRequestId();
      
    } catch (error) {
      console.warn('Failed to add auth header:', error);
      // Don't fail the request, let the server handle unauthorized requests
    }

    return config;
  }

  /**
   * Request error interceptor
   */
  private requestErrorInterceptor(error: any): Promise<never> {
    console.error('Request interceptor error:', error);
    return Promise.reject(this.createAPIError(error));
  }

  /**
   * Response interceptor - handles successful responses
   */
  private responseInterceptor(response: AxiosResponse): AxiosResponse {
    // Clear retry attempts on successful response
    const requestId = this.getRequestId(response.config);
    if (requestId) {
      this.retryAttempts.delete(requestId);
    }

    return response;
  }

  /**
   * Response error interceptor - handles errors and retries
   */
  private async responseErrorInterceptor(error: AxiosError): Promise<any> {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    if (!originalRequest) {
      return Promise.reject(this.createAPIError(error));
    }

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        console.log('🔄 Attempting token refresh due to 401 error');
        await supabase.auth.refreshSession(); // This will refresh tokens automatically
        
        // Retry the original request
        return this.axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Redirect to login or emit auth error event
        this.handleAuthenticationFailure();
        return Promise.reject(this.createAPIError(error));
      }
    }

    // Handle retryable errors
    if (this.shouldRetry(error, originalRequest)) {
      const requestId = this.getRequestId(originalRequest);
      const attempts = this.retryAttempts.get(requestId) || 0;
      
      if (attempts < (originalRequest.retries || 3)) {
        this.retryAttempts.set(requestId, attempts + 1);
        
        // Calculate retry delay with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempts), 10000);
        
        console.log(`🔄 Retrying request (attempt ${attempts + 1}) after ${delay}ms`);
        
        await this.delay(delay);
        return this.axiosInstance(originalRequest);
      }
    }

    return Promise.reject(this.createAPIError(error));
  }

  /**
   * Check if endpoint is public (doesn't require authentication)
   */
  private isPublicEndpoint(url: string): boolean {
    const publicEndpoints = [
      '/health',
      '/status',
      '/vc/quick', // Public visibility check
      '/auth/', // Auth endpoints
    ];
    
    return publicEndpoints.some(endpoint => url.includes(endpoint));
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get request ID from config
   */
  private getRequestId(config: InternalAxiosRequestConfig): string {
    return config.headers?.['X-Request-ID'] as string || '';
  }

  /**
   * Check if error should be retried
   */
  private shouldRetry(error: AxiosError, config: InternalAxiosRequestConfig): boolean {
    // Don't retry if explicitly disabled
    if (config.retries === 0) {
      return false;
    }

    // Retry on network errors
    if (!error.response) {
      return true;
    }

    // Retry on server errors (5xx) and rate limiting (429)
    const status = error.response.status;
    return status >= 500 || status === 429;
  }

  /**
   * Create standardized API error
   */
  private createAPIError(error: AxiosError): APIError {
    const status = error.response?.status || 0;
    const responseData = error.response?.data as any;
    
    return {
      code: responseData?.code || error.code || 'UNKNOWN_ERROR',
      message: responseData?.message || error.message || 'An unknown error occurred',
      status,
      details: responseData || error,
      retryable: this.shouldRetry(error, error.config as InternalAxiosRequestConfig)
    };
  }

  /**
   * Handle authentication failure
   */
  private handleAuthenticationFailure(): void {
    // Emit custom event for auth failure
    window.dispatchEvent(new CustomEvent('auth:failure', {
      detail: { reason: 'token_expired' }
    }));
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, config?: RequestConfig): Promise<APIResponse<T>> {
    const cacheKey = `GET:${endpoint}:${JSON.stringify(config)}`;
    
    // Return cached promise if request is in flight
    if (config?.cache && this.requestCache.has(cacheKey)) {
      return this.requestCache.get(cacheKey);
    }

    const requestPromise = this.axiosInstance.get<APIResponse<T>>(endpoint, config)
      .then(response => response.data);

    // Cache the promise if caching is enabled
    if (config?.cache) {
      this.requestCache.set(cacheKey, requestPromise);
      
      // Clean up cache after request completes
      requestPromise.finally(() => {
        this.requestCache.delete(cacheKey);
      });
    }

    return requestPromise;
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<APIResponse<T>> {
    const response = await this.axiosInstance.post<APIResponse<T>>(endpoint, data, config);
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<APIResponse<T>> {
    const response = await this.axiosInstance.put<APIResponse<T>>(endpoint, data, config);
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<APIResponse<T>> {
    const response = await this.axiosInstance.patch<APIResponse<T>>(endpoint, data, config);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, config?: RequestConfig): Promise<APIResponse<T>> {
    const response = await this.axiosInstance.delete<APIResponse<T>>(endpoint, config);
    return response.data;
  }

  /**
   * Upload file with progress tracking
   */
  async upload<T = any>(
    endpoint: string, 
    file: File, 
    onProgress?: (progress: number) => void,
    config?: RequestConfig
  ): Promise<APIResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const uploadConfig: RequestConfig = {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      }
    };

    const response = await this.axiosInstance.post<APIResponse<T>>(endpoint, formData, uploadConfig);
    return response.data;
  }

  /**
   * Get current authentication status
   */
  async getAuthStatus(): Promise<{ authenticated: boolean; user?: any }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      
      return {
        authenticated: !!session && !error,
        user: user
      };
    } catch (error) {
      return { authenticated: false };
    }
  }

  /**
   * Clear request cache
   */
  clearCache(): void {
    this.requestCache.clear();
  }

  /**
   * Get axios instance for advanced usage
   */
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

// Create and export singleton instance
const apiClient = new APIClient();

export default apiClient;

// Export convenience methods
export const {
  get,
  post,
  put,
  patch,
  delete: del,
  upload,
  getAuthStatus,
  clearCache
} = apiClient;