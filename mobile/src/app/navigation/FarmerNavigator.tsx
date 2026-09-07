import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FarmerHomeScreen } from '../../features/farmerProfile/screens/FarmerHomeScreen';
import { CenterDetailsScreen } from '../../features/centers/screens/CenterDetailsScreen';
import { ScheduleScreen } from '../../features/centers/screens/ScheduleScreen';
import { BookingScreen } from '../../features/booking/screens/BookingScreen';
import { BookingConfirmationScreen } from '../../features/booking/screens/BookingConfirmationScreen';
import { LiveQueueScreen } from '../../features/queue/screens/LiveQueueScreen';
import { BookingHistoryScreen } from '../../features/history/screens/BookingHistoryScreen';
import { FarmerStackParamList } from './types';
import { colors } from '../../theme';

const Stack = createNativeStackNavigator<FarmerStackParamList>();

export const FarmerNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '600' },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="Home"
        component={FarmerHomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CenterDetails"
        component={CenterDetailsScreen}
        options={{ title: 'Center Details' }}
      />
      <Stack.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{ title: 'Available Slots' }}
      />
      <Stack.Screen
        name="Booking"
        component={BookingScreen}
        options={{ title: 'Confirm Booking' }}
      />
      <Stack.Screen
        name="BookingConfirmation"
        component={BookingConfirmationScreen}
        options={{ title: 'Confirmation', headerLeft: () => null }}
      />
      <Stack.Screen
        name="LiveQueue"
        component={LiveQueueScreen}
        options={{ title: 'Live Queue', headerBackVisible: true }}
      />
      <Stack.Screen
        name="BookingHistory"
        component={BookingHistoryScreen}
        options={{ title: 'Booking History' }}
      />
    </Stack.Navigator>
  );
};
