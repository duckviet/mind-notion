import { CONFIG } from "../core/config";
import { User } from "../core/types";

class StorageService {
  async getAccessToken(): Promise<string | null> {
    const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    return (result[CONFIG.STORAGE_KEYS.ACCESS_TOKEN] as string) || null;
  }

  async getRefreshToken(): Promise<string | null> {
    const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
    return (result[CONFIG.STORAGE_KEYS.REFRESH_TOKEN] as string) || null;
  }

  async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    await chrome.storage.local.set({
      [CONFIG.STORAGE_KEYS.ACCESS_TOKEN]: accessToken,
      [CONFIG.STORAGE_KEYS.REFRESH_TOKEN]: refreshToken,
    });
  }

  async storeUser(user: User): Promise<void> {
    await chrome.storage.local.set({
      [CONFIG.STORAGE_KEYS.USER]: user,
    });
  }

  async getUser(): Promise<User | null> {
    const result = await chrome.storage.local.get(CONFIG.STORAGE_KEYS.USER);
    return (result[CONFIG.STORAGE_KEYS.USER] as User) || null;
  }

  async clearAuth(): Promise<void> {
    await chrome.storage.local.remove([
      CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
      CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
      CONFIG.STORAGE_KEYS.USER,
    ]);
  }
}

export const storageService = new StorageService();
