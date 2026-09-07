import { apiClient } from '../../../core/network/apiClient';
import { ApiResponse, User, Procurement } from '../../../core/types';

export const farmerApi = {
  async getProfile(): Promise<ApiResponse<User>> {
    const response = await apiClient.get('/farmers/me');
    return response.data;
  },

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await apiClient.put('/farmers/me', data);
    return response.data;
  },

  async getBookings(): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get('/farmers/me/bookings');
    return response.data;
  },

  async getProcurements(): Promise<ApiResponse<Procurement[]>> {
    const response = await apiClient.get('/farmers/me/procurements');
    return response.data;
  },
};
