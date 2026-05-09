import { CONFIG } from "../core/config";
import { AuthResponse, User } from "../core/types";
import { HttpService } from "./http.service";
import { storageService } from "./storage.service";

class AuthService extends HttpService {
  protected async getAccessToken(): Promise<string | null> {
    return storageService.getAccessToken();
  }

  protected async tryRefreshToken(): Promise<boolean> {
    const refreshToken = await storageService.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const { controller, timeoutId } = this.createAbortController();

      const response = await fetch(
        `${this.baseUrl}${CONFIG.API_ENDPOINTS.REFRESH_TOKEN}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        return false;
      }

      const tokens = await response.json();
      await storageService.storeTokens(tokens.access_token, tokens.refresh_token);
      return true;
    } catch {
      return false;
    }
  }

  protected async clearAuth(): Promise<void> {
    await storageService.clearAuth();
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await storageService.getAccessToken();
    return !!token;
  }

  async login(username: string, password: string): Promise<{ tokens: AuthResponse; user: User }> {
    const result = await this.request<AuthResponse>(CONFIG.API_ENDPOINTS.LOGIN, {
      method: "POST",
      body: JSON.stringify({ username, password }),
      authenticated: false,
    });

    await storageService.storeTokens(result.access_token, result.refresh_token);
    const user = await this.checkAuth();
    return { tokens: result, user };
  }

  async register(username: string, email: string, password: string, name: string): Promise<{ tokens: AuthResponse; user: User }> {
    const result = await this.request<AuthResponse>(CONFIG.API_ENDPOINTS.REGISTER, {
      method: "POST",
      body: JSON.stringify({ username, email, password, name }),
      authenticated: false,
    });

    await storageService.storeTokens(result.access_token, result.refresh_token);
    const user = await this.checkAuth();
    return { tokens: result, user };
  }

  async logout(): Promise<void> {
    try {
      await this.request(CONFIG.API_ENDPOINTS.LOGOUT, {
        method: "POST",
      });
    } catch {
      // Ignore logout errors
    }
    await this.clearAuth();
  }

  async checkAuth(): Promise<User> {
    const user = await this.request<User>(CONFIG.API_ENDPOINTS.CHECK_AUTH, {
      method: "GET",
    });
    await storageService.storeUser(user);
    return user;
  }
}

export const authService = new AuthService();
