export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  idempotencyKey?: string;
}

export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data: T;
  idempotencyKey?: string;
}

export class ApiClient {
  private authToken: string | null = null;
  private requestLog: Array<{ path: string; method: string; idempotencyKey?: string }> = [];

  constructor(private readonly baseUrl = 'https://api.beakbreaker.gg/v5') {}

  public setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  public getAuthToken(): string | null {
    return this.authToken;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public async request<T>(
    path: string,
    mockPayload: T,
    options: ApiRequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const method = options.method ?? 'GET';
    this.requestLog.push({
      path,
      method,
      idempotencyKey: options.idempotencyKey,
    });

    return {
      ok: true,
      status: 200,
      data: mockPayload,
      idempotencyKey: options.idempotencyKey,
    };
  }

  public getRequestLog() {
    return [...this.requestLog];
  }
}
