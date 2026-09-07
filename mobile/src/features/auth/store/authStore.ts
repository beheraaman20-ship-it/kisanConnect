import { create } from 'zustand';
import { User, UserRole } from '../../../core/types';
import { secureStorage } from '../../../core/storage/secureStorage';
import { localStorage } from '../../../core/storage/localStorage';
import { authApi } from '../api/authApi';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  sendOtp: (mobile: string) => Promise<void>;
  verifyOtp: (mobile: string, otp: string) => Promise<void>;
  loadUser: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  sendOtp: async (mobile) => {
    try {
      set({ isLoading: true, error: null });
      await authApi.sendOtp(mobile);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error?.message || 'Failed to send OTP',
      });
      throw error;
    }
  },

  verifyOtp: async (mobile, otp) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authApi.verifyOtp(mobile, otp);
      const { token, refreshToken, user } = response.data;

      await secureStorage.setToken(token);
      await secureStorage.setRefreshToken(refreshToken);
      await localStorage.setUserData(user as unknown as Record<string, unknown>);

      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error?.message || 'Invalid OTP',
      });
      throw error;
    }
  },

  loadUser: async () => {
    try {
      set({ isLoading: true });
      const token = await secureStorage.getToken();
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const response = await authApi.getMe();
      set({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch {
      await secureStorage.clearAll();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Logout even if API fails
    } finally {
      await secureStorage.clearAll();
      await localStorage.clearAll();
      set({ user: null, isAuthenticated: false });
    }
  },

  clearError: () => set({ error: null }),
}));
