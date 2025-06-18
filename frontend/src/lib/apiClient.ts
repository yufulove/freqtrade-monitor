import { APIResponse, APIError } from '@/types';
import { ErrorType } from '@/types/errors';

// API客户端配置
interface APIClientConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

// 请求配置
interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  skipErrorHandling?: boolean;
}

// API错误类
export class APIClientError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: Record<string, any>;
  public readonly url: string;
  public readonly method: string;

  constructor(
    message: string,
    status: number,
    code: string,
    url: string,
    method: string,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'APIClientError';
    this.status = status;
    this.code = code;
    this.url = url;
    this.method = method;
    this.details = details;
  }
}

// 网络错误类
export class NetworkError extends Error {
  public readonly url: string;
  public readonly method: string;

  constructor(message: string, url: string, method: string) {
    super(message);
    this.name = 'NetworkError';
    this.url = url;
    this.method = method;
  }
}

// 超时错误类
export class TimeoutError extends Error {
  public readonly timeout: number;
  public readonly url: string;
  public readonly method: string;

  constructor(timeout: number, url: string, method: string) {
    super(`Request timeout after ${timeout}ms`);
    this.name = 'TimeoutError';
    this.timeout = timeout;
    this.url = url;
    this.method = method;
  }
}

class APIClient {
  private config: APIClientConfig;
  private authToken: string | null = null;

  constructor(config: Partial<APIClientConfig> = {}) {
    this.config = {
      baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      ...config
    };
  }

  // 设置认证令牌
  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  // 获取认证令牌
  getAuthToken(): string | null {
    return this.authToken;
  }

  // 构建完整URL
  private buildURL(endpoint: string): string {
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${this.config.baseURL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    return url;
  }

  // 构建请求头
  private buildHeaders(customHeaders: HeadersInit = {}): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...customHeaders
    };

    if (this.authToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  // 处理响应
  private async handleResponse<T>(response: Response, url: string, method: string): Promise<APIResponse<T>> {
    const contentType = response.headers.get('content-type');
    const isJSON = contentType?.includes('application/json');

    let data: any;
    try {
      data = isJSON ? await response.json() : await response.text();
    } catch (error) {
      throw new APIClientError(
        'Failed to parse response',
        response.status,
        'PARSE_ERROR',
        url,
        method
      );
    }

    if (!response.ok) {
      const errorMessage = data?.detail || data?.message || `HTTP ${response.status}`;
      const errorCode = data?.code || `HTTP_${response.status}`;
      
      throw new APIClientError(
        errorMessage,
        response.status,
        errorCode,
        url,
        method,
        data
      );
    }

    return {
      data,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      success: true
    };
  }

  // 延迟函数
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 执行请求（带重试机制）
  private async executeRequest<T>(
    url: string,
    config: RequestConfig
  ): Promise<APIResponse<T>> {
    const { retries = this.config.retries, retryDelay = this.config.retryDelay, ...fetchConfig } = config;
    const method = fetchConfig.method || 'GET';
    
    let lastError: Error;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // 创建AbortController用于超时控制
        const controller = new AbortController();
        const timeout = config.timeout || this.config.timeout;
        
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, timeout);

        const response = await fetch(url, {
          ...fetchConfig,
          signal: controller.signal,
          headers: this.buildHeaders(fetchConfig.headers)
        });

        clearTimeout(timeoutId);
        return await this.handleResponse<T>(response, url, method);
        
      } catch (error) {
        lastError = error as Error;
        
        // 处理不同类型的错误
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            lastError = new TimeoutError(config.timeout || this.config.timeout, url, method);
          } else if (error.message.includes('fetch')) {
            lastError = new NetworkError(error.message, url, method);
          }
        }
        
        // 如果是最后一次尝试，或者是不应该重试的错误，直接抛出
        if (attempt === retries || 
            lastError instanceof APIClientError && lastError.status < 500) {
          throw lastError;
        }
        
        // 等待后重试
        if (attempt < retries) {
          await this.delay(retryDelay * Math.pow(2, attempt)); // 指数退避
        }
      }
    }
    
    throw lastError!;
  }

  // GET请求
  async get<T = any>(endpoint: string, config: RequestConfig = {}): Promise<APIResponse<T>> {
    const url = this.buildURL(endpoint);
    return this.executeRequest<T>(url, { ...config, method: 'GET' });
  }

  // POST请求
  async post<T = any>(endpoint: string, data?: any, config: RequestConfig = {}): Promise<APIResponse<T>> {
    const url = this.buildURL(endpoint);
    return this.executeRequest<T>(url, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  // PUT请求
  async put<T = any>(endpoint: string, data?: any, config: RequestConfig = {}): Promise<APIResponse<T>> {
    const url = this.buildURL(endpoint);
    return this.executeRequest<T>(url, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  // PATCH请求
  async patch<T = any>(endpoint: string, data?: any, config: RequestConfig = {}): Promise<APIResponse<T>> {
    const url = this.buildURL(endpoint);
    return this.executeRequest<T>(url, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  // DELETE请求
  async delete<T = any>(endpoint: string, config: RequestConfig = {}): Promise<APIResponse<T>> {
    const url = this.buildURL(endpoint);
    return this.executeRequest<T>(url, { ...config, method: 'DELETE' });
  }

  // 上传文件
  async upload<T = any>(
    endpoint: string, 
    file: File | FormData, 
    config: RequestConfig = {}
  ): Promise<APIResponse<T>> {
    const url = this.buildURL(endpoint);
    
    const formData = file instanceof FormData ? file : new FormData();
    if (file instanceof File) {
      formData.append('file', file);
    }

    const headers = this.buildHeaders(config.headers);
    // 移除Content-Type，让浏览器自动设置（包含boundary）
    delete (headers as Record<string, string>)['Content-Type'];

    return this.executeRequest<T>(url, {
      ...config,
      method: 'POST',
      body: formData,
      headers
    });
  }

  // 下载文件
  async download(
    endpoint: string, 
    filename?: string, 
    config: RequestConfig = {}
  ): Promise<void> {
    const url = this.buildURL(endpoint);
    
    try {
      const response = await this.executeRequest<Blob>(url, {
        ...config,
        method: 'GET'
      });

      // 创建下载链接
      const blob = response.data as unknown as Blob;
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      throw error;
    }
  }
}

// 创建默认实例
export const apiClient = new APIClient();

// 导出类型和错误类
export { APIClient, APIClientError, NetworkError, TimeoutError };
export type { APIClientConfig, RequestConfig };