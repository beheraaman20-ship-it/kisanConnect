import messaging from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';
import { apiClient } from '../network/apiClient';

export const requestNotificationPermission = async (): Promise<boolean> => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    await registerDevice();
  }

  return enabled;
};

const registerDevice = async () => {
  try {
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      await apiClient.post('/devices/register', {
        fcmToken,
        platform: Platform.OS,
      });
    }
  } catch (error) {
    console.error('Failed to register device:', error);
  }
};

export const setupNotificationListeners = (
  onNotificationReceived?: (message: any) => void
) => {
  messaging().onMessage(async (remoteMessage) => {
    if (onNotificationReceived) {
      onNotificationReceived(remoteMessage);
    }
  });

  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('Notification opened:', remoteMessage);
  });

  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Background message:', remoteMessage);
  });
};
