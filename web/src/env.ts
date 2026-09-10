const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export const env = {
  API_BASE_URL,
  SOCKET_URL,
  ENV: import.meta.env.VITE_ENV || 'development',
} as const;