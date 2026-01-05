// Extension Configuration
const CONFIG = {
  // API Settings
  API_BASE_URL: "http://localhost:8080",
  API_ENDPOINTS: {
    // Auth endpoints
    LOGIN: "/api/v1/auth/login",
    REGISTER: "/api/v1/auth/register",
    LOGOUT: "/api/v1/auth/logout",
    REFRESH_TOKEN: "/api/v1/auth/refresh-token",
    CHECK_AUTH: "/api/v1/auth/check",
    // Note endpoints
    CREATE_NOTE: "/api/v1/notes",
    ADD_NOTE: "/index/add_note",
    ADD_WEB_ARTICLE: "/index/add_web_article",
  },

  // Storage Keys
  STORAGE_KEYS: {
    ACCESS_TOKEN: "access_token",
    REFRESH_TOKEN: "refresh_token",
    USER: "user",
  },

  // Request Settings
  REQUEST_TIMEOUT: 10000, // 10 seconds

  // UI Settings
  ANIMATION_DURATION: 200,
  MESSAGE_AUTO_HIDE_DELAY: 3000,

  // Extension Info
  NAME: "Mind Notion",
  VERSION: "2.1",
};

// Freeze config to prevent modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.API_ENDPOINTS);
Object.freeze(CONFIG.STORAGE_KEYS);
