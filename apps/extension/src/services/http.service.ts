import { CONFIG } from "../core/config";
import { ApiErrorResponse } from "../core/types";

export class ApiError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "ApiError";
  }
}

export interface RequestOptions extends RequestInit {
  authenticated?: boolean;
  _retried?: boolean;
}

export class HttpService {
  protected baseUrl = CONFIG.API_BASE_URL;
  protected timeout = CONFIG.REQUEST_TIMEOUT;

  protected createAbortController() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    return { controller, timeoutId };
  }

  // Abstract method to be implemented by child (AuthService) to avoid circular dependency
  protected async getAccessToken(): Promise<string | null> {
    return null;
  }

  // Abstract method to try refreshing token
  protected async tryRefreshToken(): Promise<boolean> {
    return false;
  }

  // Abstract method to clear auth
  protected async clearAuth(): Promise<void> {}

  public async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { controller, timeoutId } = this.createAbortController();

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string> || {}),
      };

      if (options.authenticated !== false) {
        const token = await this.getAccessToken();
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers,
      });

      clearTimeout(timeoutId);

      // Handle 401 - try to refresh token
      if (response.status === 401 && options.authenticated !== false && !options._retried) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          // Retry the original request with new token
          return this.request<T>(endpoint, { ...options, _retried: true });
        } else {
          await this.clearAuth();
          throw new ApiError("Session expired. Please login again.", 401);
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = errorText;
        try {
          const errorJson = JSON.parse(errorText) as ApiErrorResponse;
          errorMessage = errorJson.error || errorJson.message || errorText;
        } catch {}
        throw new ApiError(errorMessage || `HTTP ${response.status}`, response.status);
      }

      // Check if there's no content
      if (response.status === 204 || response.headers.get("content-length") === "0") {
        return {} as T;
      }

      return await response.json() as T;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        throw new ApiError("Request timeout", 408);
      }

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(error.message || "Network error", 0);
    }
  }
}
