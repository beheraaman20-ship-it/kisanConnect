import * as Keychain from 'react-native-keychain';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const secureStorage = {
  async setToken(token: string): Promise<void> {
    await Keychain.setGenericPassword(TOKEN_KEY, token, {
      service: TOKEN_KEY,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },

  async getToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({ service: TOKEN_KEY });
      return credentials ? credentials.password : null;
    } catch {
      return null;
    }
  },

  async removeToken(): Promise<void> {
    await Keychain.resetGenericPassword({ service: TOKEN_KEY });
  },

  async setRefreshToken(token: string): Promise<void> {
    await Keychain.setGenericPassword(REFRESH_TOKEN_KEY, token, {
      service: REFRESH_TOKEN_KEY,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({ service: REFRESH_TOKEN_KEY });
      return credentials ? credentials.password : null;
    } catch {
      return null;
    }
  },

  async removeRefreshToken(): Promise<void> {
    await Keychain.resetGenericPassword({ service: REFRESH_TOKEN_KEY });
  },

  async clearAll(): Promise<void> {
    await Keychain.resetGenericPassword({ service: TOKEN_KEY });
    await Keychain.resetGenericPassword({ service: REFRESH_TOKEN_KEY });
  },
};
