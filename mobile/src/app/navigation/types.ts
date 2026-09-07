import { Slot, Token } from '../../core/types';

export type AuthStackParamList = {
  Login: undefined;
  Otp: { mobile: string };
};

export type FarmerStackParamList = {
  Home: undefined;
  CenterDetails: { centerId: string };
  Schedule: { centerId: string };
  Booking: { centerId: string; slot: Slot };
  BookingConfirmation: { token: Token; centerId: string };
  LiveQueue: { centerId: string; tokenId: string; tokenNumber: string };
  BookingHistory: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Farmer: undefined;
  Notifications: undefined;
  Profile: undefined;
};
