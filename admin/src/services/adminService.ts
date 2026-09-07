import { apiClient } from './api';

export const adminService = {
  async getDashboard() {
    const response = await apiClient.get('/admin/dashboard');
    return response.data;
  },

  async getStats() {
    const response = await apiClient.get('/admin/statistics');
    return response.data;
  },

  async getFarmers() {
    const response = await apiClient.get('/admin/farmers');
    return response.data;
  },

  async getCenters() {
    const response = await apiClient.get('/admin/centers');
    return response.data;
  },

  async createCenter(data: Record<string, unknown>) {
    const response = await apiClient.post('/admin/centers', data);
    return response.data;
  },

  async updateCenter(id: string, data: Record<string, unknown>) {
    const response = await apiClient.put(`/admin/centers/${id}`, data);
    return response.data;
  },

  async getSchedules() {
    const response = await apiClient.get('/admin/schedules');
    return response.data;
  },

  async createSchedule(data: Record<string, unknown>) {
    const response = await apiClient.post('/admin/schedules', data);
    return response.data;
  },

  async updateSchedule(id: string, data: Record<string, unknown>) {
    const response = await apiClient.put(`/admin/schedules/${id}`, data);
    return response.data;
  },

  async getTodaysQueue() {
    const response = await apiClient.get('/center/queue/today');
    return response.data;
  },

  async getProcurements() {
    const response = await apiClient.get('/admin/procurements');
    return response.data;
  },

  async getTokens() {
    const response = await apiClient.get('/admin/tokens');
    return response.data;
  },
};
