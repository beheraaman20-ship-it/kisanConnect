import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryProvider } from './QueryProvider';
import { RootNavigator } from '../navigation/RootNavigator';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { setupNotificationListeners } from '../../core/notifications/fcm';

const AppContent: React.FC = () => {
  const { loadUser } = useAuth();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    setupNotificationListeners();
  }, []);

  return <RootNavigator />;
};

export const AppProviders: React.FC = () => {
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <NavigationContainer>
          <AppContent />
        </NavigationContainer>
      </QueryProvider>
    </SafeAreaProvider>
  );
};
