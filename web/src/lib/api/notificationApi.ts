import { apiClient } from '@/lib/api';
import type { ApiResponse, Notification } from '@/lib/types';
import { mapNotification } from '@/lib/api/normalize';

export const notificationApi = {
  async list(): Promise<ApiResponse<Notification[]>> {
    const response = await apiClient.get('/notifications');
    return {
      ...response.data,
      data: (response.data.data?.notifications ?? []).map(mapNotification),
    };
  },
};