import { apiClient } from '../../../core/network/apiClient';
import { ApiResponse, ProcurementCenter, Slot } from '../../../core/types';

export const centersApi = {
  async getCenters(): Promise<ApiResponse<ProcurementCenter[]>> {
    const response = await apiClient.get('/centers');
    return response.data;
  },

  async getCenter(id: string): Promise<ApiResponse<ProcurementCenter>> {
    const response = await apiClient.get(`/centers/${id}`);
    return response.data;
  },

  async getSchedule(id: string): Promise<ApiResponse<Slot[]>> {
    const response = await apiClient.get(`/centers/${id}/schedule`);
    return response.data;
  },

  async getRecommendations(): Promise<ApiResponse<ProcurementCenter[]>> {
    const response = await apiClient.get('/centers/recommendations');
    return response.data;
  },
};
