export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  idempotencyKey?: string;
  useOfflineFallback?: boolean;
  headers?: Record<string, string>;
}

export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data: T;
  idempotencyKey?: string;
  isFallback?: boolean;
  error?: string;
}

export interface RequestLogEntry {
  path: string;
  method: string;
  idempotencyKey?: string;
}

export class ApiClient {
  private authToken: string | null = null;
  private requestLog: RequestLogEntry[] = [];
  private baseUrl: string;

  constructor(baseUrl = 'https://api.beakbreaker.gg/v5') {
    this.baseUrl = baseUrl;
  }

  public setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  public getAuthToken(): string | null {
    return this.authToken;
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public getRequestLog(): RequestLogEntry[] {
    return [...this.requestLog];
  }

  public clearRequestLog(): void {
    this.requestLog = [];
  }

  private resolveUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const cleanBase = this.baseUrl.replace(/\/+$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
  }

  public async request<T>(
    path: string,
    fallbackPayload: T,
    options: ApiRequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const method = (options.method ?? 'GET').toUpperCase();
    const useOfflineFallback = options.useOfflineFallback ?? true;

    this.requestLog.push({
      path,
      method,
      idempotencyKey: options.idempotencyKey,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    if (options.idempotencyKey) {
      headers['X-Idempotency-Key'] = options.idempotencyKey;
    }

    let body: string | undefined;
    if (options.body !== undefined && options.body !== null && method !== 'GET' && method !== 'HEAD') {
      body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }

    const url = this.resolveUrl(path);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
      });

      if (response.status >= 500) {
        if (useOfflineFallback) {
          return {
            ok: false,
            status: response.status,
            data: fallbackPayload,
            idempotencyKey: options.idempotencyKey,
            isFallback: true,
            error: `Server error: ${response.status}`,
          };
        }

        return {
          ok: false,
          status: response.status,
          data: fallbackPayload,
          idempotencyKey: options.idempotencyKey,
          isFallback: false,
          error: `Server error: ${response.status}`,
        };
      }

      let data: T;
      try {
        const text = await response.text();
        data = text ? (JSON.parse(text) as T) : fallbackPayload;
      } catch {
        data = fallbackPayload;
      }

      return {
        ok: response.ok,
        status: response.status,
        data,
        idempotencyKey: options.idempotencyKey,
        isFallback: false,
      };
    } catch (err) {
      if (useOfflineFallback) {
        return {
          ok: false,
          status: 0,
          data: fallbackPayload,
          idempotencyKey: options.idempotencyKey,
          isFallback: true,
          error: err instanceof Error ? err.message : 'Network error',
        };
      }
      throw err;
    }
  }
}
