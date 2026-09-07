import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER_DATA: 'user_data',
  LAST_CENTER: 'last_center',
  NOTIFICATION_SETTINGS: 'notification_settings',
} as const;

export const localStorage = {
  async setUserData(data: Record<string, unknown>): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(data));
  },

  async getUserData(): Promise<Record<string, unknown> | null> {
    const data = await AsyncStorage.getItem(KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  },

  async removeUserData(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.USER_DATA);
  },

  async setLastCenter(centerId: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.LAST_CENTER, centerId);
  },

  async getLastCenter(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.LAST_CENTER);
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  },
};
