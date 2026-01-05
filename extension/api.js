// API Service Layer with Authentication
class ApiService {
  constructor() {
    this.baseUrl = CONFIG.API_BASE_URL;
    this.timeout = CONFIG.REQUEST_TIMEOUT;
  }

  /**
   * Create an AbortController with timeout
   */
  createAbortController() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    return { controller, timeoutId };
  }

  /**
   * Get stored access token
   */
  async getAccessToken() {
    const result = await chrome.storage.local.get(
      CONFIG.STORAGE_KEYS.ACCESS_TOKEN
    );
    return result[CONFIG.STORAGE_KEYS.ACCESS_TOKEN] || null;
  }

  /**
   * Get stored refresh token
   */
  async getRefreshToken() {
    const result = await chrome.storage.local.get(
      CONFIG.STORAGE_KEYS.REFRESH_TOKEN
    );
    return result[CONFIG.STORAGE_KEYS.REFRESH_TOKEN] || null;
  }

  /**
   * Store tokens
   */
  async storeTokens(accessToken, refreshToken) {
    await chrome.storage.local.set({
      [CONFIG.STORAGE_KEYS.ACCESS_TOKEN]: accessToken,
      [CONFIG.STORAGE_KEYS.REFRESH_TOKEN]: refreshToken,
    });
  }

  /**
   * Store user info
   */
  async storeUser(user) {
    await chrome.storage.local.set({
      [CONFIG.STORAGE_KEYS.USER]: user,
    });
  }

  /**
   * Get stored user
   */
  async getUser() {
    const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.USER);
    return result[CONFIG.STORAGE_KEYS.USER] || null;
  }

  /**
   * Clear all stored auth data
   */
  async clearAuth() {
    await chrome.storage.local.remove([
      CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
      CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
      CONFIG.STORAGE_KEYS.USER,
    ]);
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    const token = await this.getAccessToken();
    return !!token;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  async request(endpoint, options = {}) {
    const { controller, timeoutId } = this.createAbortController();

    try {
      // Add auth header if we have a token and it's not an auth endpoint
      const headers = {
        "Content-Type": "application/json",
        ...options.headers,
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
      if (response.status === 401 && options.authenticated !== false) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          // Retry the original request with new token
          return this.request(endpoint, { ...options, _retried: true });
        } else {
          await this.clearAuth();
          throw new ApiError("Session expired. Please login again.", 401);
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || errorText;
        } catch {}
        throw new ApiError(
          errorMessage || `HTTP ${response.status}`,
          response.status
        );
      }

      return await response.json();
    } catch (error) {
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

  /**
   * Try to refresh the access token
   */
  async tryRefreshToken() {
    const refreshToken = await this.getRefreshToken();
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
      await this.storeTokens(tokens.access_token, tokens.refresh_token);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Login with email/username and password
   */
  async login(username, password) {
    const result = await this.request(CONFIG.API_ENDPOINTS.LOGIN, {
      method: "POST",
      body: JSON.stringify({ username, password }),
      authenticated: false,
    });

    // Store tokens
    await this.storeTokens(result.access_token, result.refresh_token);

    // Fetch and store user info
    const user = await this.checkAuth();
    return { tokens: result, user };
  }

  /**
   * Register new user
   */
  async register(username, email, password, name) {
    const result = await this.request(CONFIG.API_ENDPOINTS.REGISTER, {
      method: "POST",
      body: JSON.stringify({ username, email, password, name }),
      authenticated: false,
    });

    // Store tokens
    await this.storeTokens(result.access_token, result.refresh_token);

    // Fetch and store user info
    const user = await this.checkAuth();
    return { tokens: result, user };
  }

  /**
   * Logout
   */
  async logout() {
    try {
      await this.request(CONFIG.API_ENDPOINTS.LOGOUT, {
        method: "POST",
      });
    } catch {
      // Ignore logout errors
    }
    await this.clearAuth();
  }

  /**
   * Check auth status and get user info
   */
  async checkAuth() {
    const user = await this.request(CONFIG.API_ENDPOINTS.CHECK_AUTH, {
      method: "GET",
    });
    await this.storeUser(user);
    return user;
  }

  /**
   * Save selected text as a note (requires auth)
   */
  async saveSelectedText(data) {
    return this.request(CONFIG.API_ENDPOINTS.CREATE_NOTE, {
      method: "POST",
      body: JSON.stringify({
        title: data.source_title || "Saved from extension",
        content: data.content,
        content_type: "text",
        status: "draft",
        is_public: false,
      }),
    });
  }

  /**
   * Save web article URL
   */
  async saveWebArticle(data) {
    return this.request(CONFIG.API_ENDPOINTS.ADD_WEB_ARTICLE, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

// Export singleton instance
const apiService = new ApiService();
