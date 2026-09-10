import { apiClient } from '@/lib/api';
import { storage } from '@/lib/storage';
import type { ApiResponse, User } from '@/lib/types';
import { mapUser } from '@/lib/api/normalize';

export const authApi = {
  async sendOtp(
    mobile: string
  ): Promise<ApiResponse<{ message: string; devOtp?: string }>> {
    const response = await apiClient.post('/auth/send-otp', { mobile });
    return response.data;
  },

  async verifyOtp(
    mobile: string,
    otp: string
  ): Promise<ApiResponse<{ accessToken: string; refreshToken: string; user: User }>> {
    const response = await apiClient.post('/auth/verify-otp', { mobile, otp });
    return {
      ...response.data,
      data: {
        accessToken: response.data.data.accessToken,
        refreshToken: response.data.data.refreshToken,
        user: mapUser(response.data.data.user),
      },
    };
  },

  async getMe(): Promise<ApiResponse<User>> {
    const response = await apiClient.get('/auth/me');
    return { ...response.data, data: mapUser(response.data.data.user) };
  },

  async logout(): Promise<void> {
    const refreshToken = storage.getRefreshToken();
    await apiClient.post('/auth/logout', { refreshToken });
  },
};