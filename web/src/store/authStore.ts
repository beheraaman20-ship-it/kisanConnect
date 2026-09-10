import { create } from 'zustand';
import { storage } from '@/lib/storage';
import { authApi } from '@/lib/api/authApi';
import type { User } from '@/lib/types';

const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as {
      response?: { data?: { error?: { message?: string } } };
    };
    return axiosError.response?.data?.error?.message ?? '';
  }
  return '';
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  devOtp: string | null;
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
  devOtp: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  sendOtp: async (mobile) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authApi.sendOtp(mobile);
      set({ isLoading: false, devOtp: response.data.devOtp ?? null });
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error) || 'Failed to send OTP',
      });
      throw error;
    }
  },

  verifyOtp: async (mobile, otp) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authApi.verifyOtp(mobile, otp);
      const { accessToken, refreshToken, user } = response.data;

      storage.setToken(accessToken);
      storage.setRefreshToken(refreshToken);
      storage.setUserData(user as unknown as Record<string, unknown>);

      set({ user, isAuthenticated: true, isLoading: false, devOtp: null });
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error) || 'Invalid OTP',
      });
      throw error;
    }
  },

  loadUser: async () => {
    try {
      set({ isLoading: true });
      const token = storage.getToken();
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const response = await authApi.getMe();
      set({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch {
      storage.clearAll();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Logout even if API fails
    } finally {
      storage.clearAll();
      set({ user: null, isAuthenticated: false, devOtp: null });
    }
  },

  clearError: () => set({ error: null }),
}));