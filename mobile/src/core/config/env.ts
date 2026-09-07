import Config from 'react-native-config';

export const env = {
  API_BASE_URL: Config.API_BASE_URL || 'http://localhost:3000/api/v1',
  SOCKET_URL: Config.SOCKET_URL || 'http://localhost:3000',
  ENV: Config.ENV || 'development',
} as const;
