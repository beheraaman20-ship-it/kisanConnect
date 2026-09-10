import { apiClient } from '@/lib/api';
import type { ApiResponse, Procurement, User } from '@/lib/types';
import { mapBooking, mapUser, type Booking } from '@/lib/api/normalize';

export const farmerApi = {
  async getProfile(): Promise<ApiResponse<User>> {
    const response = await apiClient.get('/farmers/me');
    return { ...response.data, data: mapUser(response.data.data.user) };
  },

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await apiClient.put('/farmers/me', data);
    return { ...response.data, data: mapUser(response.data.data.user) };
  },

  async getBookings(): Promise<ApiResponse<Booking[]>> {
    const response = await apiClient.get('/farmers/me/bookings');
    return {
      ...response.data,
      data: (response.data.data?.bookings ?? []).map(mapBooking),
    };
  },

  async getProcurements(): Promise<ApiResponse<Procurement[]>> {
    const response = await apiClient.get('/farmers/me/procurements');
    return {
      ...response.data,
      data: (response.data.data?.procurements ?? []) as Procurement[],
    };
  },
};