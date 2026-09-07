import { apiClient } from '../../../core/network/apiClient';
import { ApiResponse, Token } from '../../../core/types';

export const bookingApi = {
  async bookSlot(slotId: string): Promise<ApiResponse<Token>> {
    const response = await apiClient.post('/slots/book', { slotId });
    return response.data;
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
      newSlotId,
    });
    return response.data;
  },

  async getToken(tokenId: string): Promise<ApiResponse<Token>> {
    const response = await apiClient.get(`/tokens/${tokenId}`);
    return response.data;
  },
};
