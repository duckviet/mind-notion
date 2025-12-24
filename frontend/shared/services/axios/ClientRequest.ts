import type {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import authAction from "../actions/auth.action";
import EventEmitter from "../events/EventEmitter";

// Define a type for the failed request queue items
interface FailedRequestQueueItem {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}
export interface IClientRequest {
  get events(): EventEmitter;

  getAxiosInstance(): AxiosInstance;
  getAccessToken(): string | null;
  hasAccessToken(): boolean;
  getRefreshToken(): string | null;
  hasRefreshToken(): boolean;
  setAccessToken(token: string): void;
  setRefreshToken(token: string): void;
  removeAccessToken(): void;
  removeRefreshToken(): void;
  isAccessTokenValid(): boolean;
}

export default class ClientRequest implements IClientRequest {
  static instance: ClientRequest | null = null;

  public static getInstance(): ClientRequest {
    if (!ClientRequest.instance) {
      ClientRequest.instance = new ClientRequest();
    }
    return ClientRequest.instance;
  }

  private axiosInstance!: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: FailedRequestQueueItem[] = [];
  public events = new EventEmitter();
  public static EVENTS = {
    FORBIDDEN: "FORBIDDEN", // 401
    TOKEN_EXPIRED: "TOKEN_EXPIRED",
  };

  private processQueue(error: Error | null, token: string | null = null) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  public getAccessToken(): string | null {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem("access_token");
  }

  constructor() {
    const backendUrl =
      (typeof process !== "undefined" && process.env.NEXT_PUBLIC_BACKEND_URL) ||
      "http://localhost:8080/api/v1";
    this.axiosInstance = axios.create({
      baseURL: backendUrl,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });
    const handleRequestWithToken = async (
      config: InternalAxiosRequestConfig
    ) => {
      const accessToken = this.getAccessToken();
      if (this.isAccessTokenValid()) {
        config.headers["Authorization"] = `Bearer ${accessToken}`;
      } else {
        this.events.emit(ClientRequest.EVENTS.TOKEN_EXPIRED);
        const waitRefetchToken = new Promise((resolve) => {
          const interval = setInterval(() => {
            if (this.isAccessTokenValid()) {
              clearInterval(interval);
              resolve(null);
            }
          }, 1000);
        });
        await waitRefetchToken;
        const newToken = await this.getAccessToken();
        config.headers["Authorization"] = `Bearer ${newToken}`;
      }
      return config;
    };
    const requestHandler = async (config: InternalAxiosRequestConfig<any>) => {
      // if config have skipAuthInterceptor (token is expired) -> skip
      if (config.skipAuthInterceptor) {
        return config;
      }

      if (this.hasAccessToken()) {
        config = await handleRequestWithToken(config);
      }

      return config;
    };
    this.axiosInstance.interceptors.request.use(requestHandler.bind(this));

    this.axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
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
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers["Authorization"] = `Bearer ${token}`;
                return this.axiosInstance(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newTokens = await authAction.refreshToken();
            const { access_token, refresh_token } = newTokens;

            if (access_token && refresh_token) {
              this.setAccessToken(access_token);
              this.setRefreshToken(refresh_token);
              this.axiosInstance.defaults.headers.common["Authorization"] =
                `Bearer ${access_token}`;
              originalRequest.headers["Authorization"] =
                `Bearer ${access_token}`;

              this.processQueue(null, access_token);
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            this.processQueue(refreshError as Error, null);
            // The refreshToken action already handles logout
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  public getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
  public getRefreshToken(): string | null {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem("refresh_token");
  }
  public hasAccessToken(): boolean {
    const accessToken = this.getAccessToken();
    return !!accessToken;
  }
  public hasRefreshToken(): boolean {
    const refreshToken = this.getRefreshToken();
    return !!refreshToken;
  }
  public setAccessToken(token: string): void {
    // Store in localStorage for axios interceptor to read
    // Backend sets HttpOnly cookies automatically, so we don't need to set cookies here
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("access_token", token);
    }
    // Note: Cookies are now set by backend with HttpOnly flag (more secure)
    // We keep localStorage for axios interceptor to read and set Authorization header
  }
  public setRefreshToken(token: string): void {
    // Store in localStorage for refresh token logic
    // Backend sets HttpOnly cookies automatically
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("refresh_token", token);
    }
    // Note: Cookies are now set by backend with HttpOnly flag (more secure)
  }
  public removeAccessToken(): void {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("access_token");
    }
    // Cookies are cleared by backend on logout
    // We can't clear HttpOnly cookies from client-side
  }
  public removeRefreshToken(): void {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("refresh_token");
    }
    // Cookies are cleared by backend on logout
  }
  public isAccessTokenValid(): boolean {
    const accessToken = this.getAccessToken();
    if (!accessToken) return false;
    const decodedToken = jwtDecode(accessToken);
    const currentTime = Date.now() / 1000;
    return !!(decodedToken.exp && decodedToken.exp > currentTime);
  }
}
