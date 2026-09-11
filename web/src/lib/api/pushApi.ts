import { apiClient } from '@/lib/api';
import type { PushSubscriptionJson } from '@/lib/push';
import type { ApiResponse } from '@/lib/types';

export const pushApi = {
  async subscribe(
    subscription: PushSubscriptionJson
  ): Promise<ApiResponse<{ subscribed: boolean; vapidPublicKey: string }>> {
    const response = await apiClient.post('/push/subscribe', { subscription });
    return response.data;
  },

  async unsubscribe(endpoint: string): Promise<ApiResponse<{ unsubscribed: boolean }>> {
    const response = await apiClient.post('/push/unsubscribe', { endpoint });
    return response.data;
  },
};