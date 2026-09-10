import { apiClient } from '@/lib/api';
import type { ApiResponse, ProcurementCenter, Slot } from '@/lib/types';
import { mapCenter, mapSlot } from '@/lib/api/normalize';

export const centersApi = {
  async getCenters(): Promise<ApiResponse<ProcurementCenter[]>> {
    const response = await apiClient.get('/centers');
    return {
      ...response.data,
      data: (response.data.data?.centers ?? []).map(mapCenter),
    };
  },

  async getCenter(id: string): Promise<ApiResponse<ProcurementCenter>> {
    const response = await apiClient.get(`/centers/${id}`);
    return { ...response.data, data: mapCenter(response.data.data.center) };
  },

  async getSchedule(id: string): Promise<ApiResponse<Slot[]>> {
    const response = await apiClient.get(`/centers/${id}/schedule`);
    const slotsByDate: Record<string, any[]> = response.data.data?.slots ?? {};
    const slots = Object.values(slotsByDate).flat().map(mapSlot);
    return { ...response.data, data: slots };
  },

  async getRecommendations(): Promise<ApiResponse<ProcurementCenter[]>> {
    const response = await apiClient.get('/centers/recommendations');
    return {
      ...response.data,
      data: (response.data.data?.centers ?? []).map(mapCenter),
    };
  },
};