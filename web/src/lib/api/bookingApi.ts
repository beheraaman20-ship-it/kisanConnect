import { apiClient } from '@/lib/api';
import type { ApiResponse, Token } from '@/lib/types';
import { mapToken } from '@/lib/api/normalize';

const toId = (value: string): number => Number(value);

export const bookingApi = {
  async bookSlot(slotId: string): Promise<ApiResponse<Token>> {
    const response = await apiClient.post('/slots/book', { slotId: toId(slotId) });
    return { ...response.data, data: mapToken(response.data.data.token) };
  },

  async cancelBooking(bookingId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post(`/bookings/${bookingId}/cancel`);
    return response.data;
  },

  async rescheduleBooking(
    bookingId: string,
    newSlotId: string
  ): Promise<ApiResponse<Token>> {
    const response = await apiClient.post(`/bookings/${bookingId}/reschedule`, {
      newSlotId: toId(newSlotId),
    });
    return { ...response.data, data: mapToken(response.data.data.token) };
  },

  async getToken(tokenId: string): Promise<ApiResponse<Token>> {
    const response = await apiClient.get(`/tokens/${tokenId}`);
    return { ...response.data, data: mapToken(response.data.data.token) };
  },
};