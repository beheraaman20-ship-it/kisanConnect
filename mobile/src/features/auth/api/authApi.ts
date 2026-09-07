import { apiClient } from '../../../core/network/apiClient';
import { ApiResponse, User } from '../../../core/types';

export const authApi = {
  async sendOtp(mobile: string): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.post('/auth/send-otp', { mobile });
    return response.data;
  },

  async verifyOtp(mobile: string, otp: string): Promise<ApiResponse<{ token: string; refreshToken: string; user: User }>> {
    const response = await apiClient.post('/auth/verify-otp', { mobile, otp });
    return response.data;
  },

  async getMe(): Promise<ApiResponse<User>> {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },
};
