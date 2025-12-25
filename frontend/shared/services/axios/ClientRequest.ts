import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import Cookies from "js-cookie"; // Dùng cái này để quản lý cookie nhất quán
import { refreshToken } from "../generated/api";

interface FailedRequestQueueItem {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
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
    });

    // Request Interceptor: Chỉ đơn giản là gắn token nếu có
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Đọc từ Cookie thay vì LocalStorage để nhất quán với Middleware
        const token = Cookies.get("access_token");
        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
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
          const refresh_token = Cookies.get("refresh_token");

          try {
            // Gọi API refresh token
            // Backend nên tự set-cookie mới cho access_token và refresh_token
            const newTokens = await refreshToken({ refresh_token });
            const { access_token } = newTokens;

            // Nếu Backend không tự set cookie access_token, ta set thủ công ở đây:
            if (access_token) {
              Cookies.set("access_token", access_token);
              this.axiosInstance.defaults.headers.common["Authorization"] =
                `Bearer ${access_token}`;

              this.processQueue(null, access_token);
              return this.axiosInstance(originalRequest);
            }
            throw new Error("Refresh failed");
          } catch (refreshError) {
            this.processQueue(refreshError as Error, null);
            // Xử lý logout nếu refresh thất bại
            Cookies.remove("access_token");
            Cookies.remove("refresh_token");
            window.location.href = "/auth"; // Force reload về login
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: Error | null, token: string | null = null) {
    this.failedQueue.forEach((prom) => {
      if (error) prom.reject(error);
      else prom.resolve(token);
    });
    this.failedQueue = [];
  }

  public getAxiosInstance() {
    return this.axiosInstance;
  }
}
