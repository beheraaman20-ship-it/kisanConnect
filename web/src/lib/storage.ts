const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_DATA_KEY = 'user_data';

export const storage = {
  getToken(): string | null {
    return window.localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string): void {
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  removeToken(): void {
    window.localStorage.removeItem(TOKEN_KEY);
  },
  getRefreshToken(): string | null {
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  setRefreshToken(token: string): void {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },
  removeRefreshToken(): void {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  getUserData<T = Record<string, unknown>>(): T | null {
    const raw = window.localStorage.getItem(USER_DATA_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  setUserData(data: Record<string, unknown>): void {
    window.localStorage.setItem(USER_DATA_KEY, JSON.stringify(data));
  },
  clearAll(): void {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(USER_DATA_KEY);
  },
};