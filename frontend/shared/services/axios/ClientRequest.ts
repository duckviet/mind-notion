import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import Cookies from "js-cookie"; // Dùng cái này để quản lý cookie nhất quán
import { useAuthStore } from "@/features/auth/store/authStore";
import authAction from "@/shared/services/actions/auth.action";
import { useEditTokenStore } from "@/shared/stores/editTokenStore";
interface FailedRequestQueueItem {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

export interface StreamEvent {
  event: string;
  payload: unknown;
}

export interface StreamRequestConfig {
  url: string;
  method?: string;
  data?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  onEvent?: (event: StreamEvent) => void | Promise<void>;
}

export class ClientRequest {
  static instance: ClientRequest | null = null;
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: FailedRequestQueueItem[] = [];

  public static getInstance(): ClientRequest {
    if (!ClientRequest.instance) {
      ClientRequest.instance = new ClientRequest();
    }
    return ClientRequest.instance;
  }

  constructor() {
    this.axiosInstance = axios.create({
      baseURL:
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api/v1",
      timeout: 30000,
      headers: { "Content-Type": "application/json" },
      // Quan trọng: để trình duyệt tự động gửi HttpOnly cookies (access_token, refresh_token)
      withCredentials: true,
    });

    // Request Interceptor: Chỉ đơn giản là gắn token nếu có
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const editToken = useEditTokenStore.getState().editToken;
        if (editToken) {
          config.headers["X-Edit-Token"] = editToken;
        }
        // Đọc từ Cookie thay vì LocalStorage để nhất quán với Middleware
        const token = Cookies.get("access_token");
        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response Interceptor: Xử lý 401 & Refresh Token
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        if (
          error.response?.status === 401 &&
          originalRequest &&
          !originalRequest._retry
        ) {
          // Không refresh nếu đã logout (isAuth = false)
          const { isAuth } = useAuthStore.getState();
          if (!isAuth) {
            return Promise.reject(error);
          }

          if (this.isRefreshing) {
            // Nếu đang refresh, xếp các request khác vào hàng đợi
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers["Authorization"] = `Bearer ${token}`;
                return this.axiosInstance(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;
          // Bắt đầu quá trình refresh: bật global loading
          useAuthStore.getState().setRefreshing(true);

          try {
            // Gọi API refresh token thông qua authAction
            // Trình duyệt sẽ tự gửi HttpOnly refresh_token cookie
            const newTokens = await authAction.refreshToken();
            const { access_token } = newTokens;

            // Nếu Backend không tự set cookie access_token, ta set thủ công ở đây:
            if (access_token) {
              Cookies.set("access_token", access_token);
              this.axiosInstance.defaults.headers.common["Authorization"] =
                `Bearer ${access_token}`;

              this.processQueue(null, access_token);
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            console.log("[ClientRequest] Refresh failed", refreshError);
            this.processQueue(refreshError as Error, null);
            // Xử lý logout nếu refresh thất bại
            Cookies.remove("access_token");
            Cookies.remove("refresh_token");
            // Call logout để clear auth state
            useAuthStore.getState().logout();
            // Redirect về login page
            window.location.href = "/auth";
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
            // Kết thúc refresh: tắt global loading
            useAuthStore.getState().setRefreshing(false);
          }
        }
        return Promise.reject(error);
      },
    );
  }

  private processQueue(error: Error | null, token: string | null = null) {
    this.failedQueue.forEach((prom) => {
      if (error) prom.reject(error);
      else prom.resolve(token);
    });
    this.failedQueue = [];
  }

  private getCommonHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const token = Cookies.get("access_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const editToken = useEditTokenStore.getState().editToken;
    if (editToken) {
      headers["X-Edit-Token"] = editToken;
    }

    return headers;
  }

  private getBaseUrl(): string {
    return (
      this.axiosInstance.defaults.baseURL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      "http://localhost:8080/api/v1"
    ).replace(/\/$/, "");
  }

  private parseEventBlock(block: string): StreamEvent | null {
    const lines = block.split("\n").map((line) => line.trimEnd());
    let eventName = "message";
    const dataLines: string[] = [];

    for (const line of lines) {
      if (!line || line.startsWith(":")) {
        continue;
      }

      if (line.startsWith("event:")) {
        eventName = line.slice("event:".length).trim();
        continue;
      }

      if (line.startsWith("data:")) {
        dataLines.push(line.slice("data:".length).trimStart());
      }
    }

    if (!dataLines.length) {
      return null;
    }

    const rawData = dataLines.join("\n");
    try {
      return { event: eventName, payload: JSON.parse(rawData) };
    } catch {
      return { event: eventName, payload: rawData };
    }
  }

  public async stream(config: StreamRequestConfig): Promise<void> {
    const baseUrl = this.getBaseUrl();
    const normalizedUrl = config.url.startsWith("/")
      ? config.url
      : `/${config.url}`;
    const url = `${baseUrl}${normalizedUrl}`;

    const method = config.method || "POST";
    const headers: Record<string, string> = {
      ...this.getCommonHeaders(),
      Accept: "text/event-stream",
      ...(config.headers || {}),
    };

    const body = config.data ? JSON.stringify(config.data) : undefined;

    let response = await fetch(url, {
      method,
      credentials: "include",
      headers,
      body,
      signal: config.signal,
    });

    if (response.status === 401) {
      const { isAuth } = useAuthStore.getState();

      if (isAuth) {
        try {
          const newTokens = await authAction.refreshToken();

          if (newTokens.access_token) {
            Cookies.set("access_token", newTokens.access_token);
            this.axiosInstance.defaults.headers.common["Authorization"] =
              `Bearer ${newTokens.access_token}`;
            headers["Authorization"] = `Bearer ${newTokens.access_token}`;

            response = await fetch(url, {
              method,
              credentials: "include",
              headers,
              body,
              signal: config.signal,
            });
          }
        } catch (refreshError) {
          console.log("[ClientRequest] Stream refresh failed", refreshError);
          Cookies.remove("access_token");
          Cookies.remove("refresh_token");
          useAuthStore.getState().logout();
          window.location.href = "/auth";
          throw new Error("Session expired");
        }
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        errorText || `Request failed with status ${response.status}`,
      );
    }

    if (!response.body) {
      throw new Error("Stream response body is empty");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true }).replace(/\r/g, "");

      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() || "";

      for (const chunk of chunks) {
        const parsed = this.parseEventBlock(chunk);
        if (!parsed || !config.onEvent) {
          continue;
        }
        await config.onEvent(parsed);
      }
    }

    if (buffer.trim()) {
      const parsed = this.parseEventBlock(buffer);
      if (parsed && config.onEvent) {
        await config.onEvent(parsed);
      }
    }
  }

  public getAxiosInstance() {
    return this.axiosInstance;
  }

  // Method để cancel refresh và clear queue khi logout
  public cancelRefresh() {
    this.isRefreshing = false;
    this.processQueue(new Error("Refresh cancelled due to logout"), null);
    useAuthStore.getState().setRefreshing(false);
  }
}
