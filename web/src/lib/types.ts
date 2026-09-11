export enum UserRole {
  FARMER = 'farmer',
  STAFF = 'staff',
  ADMIN = 'admin',
}

export enum TokenStatus {
  BOOKED = 'BOOKED',
  WAITING = 'WAITING',
  VERIFICATION = 'VERIFICATION',
  INSPECTION = 'INSPECTION',
  PROCUREMENT = 'PROCUREMENT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED',
  REJECTED = 'REJECTED',
}

export interface User {
  id: string;
  name: string;
  mobile: string;
  role: UserRole;
  address?: string;
  district?: string;
  village?: string;
}

export interface ProcurementCenter {
  id: string;
  name: string;
  location: string;
  district: string;
  latitude: number;
  longitude: number;
  dailyCapacity: number;
  status: string;
  distance?: number;
  currentQueueLength?: number;
  estimatedWaitMinutes?: number;
}

export interface Slot {
  id: string;
  centerId: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  availableSlots: number;
  status: string;
}

export interface Token {
  id: string;
  tokenNumber: string;
  farmerId: string;
  centerId: string;
  slotId: string;
  status: TokenStatus;
  queuePosition: number;
  estimatedWaitTime: number;
  currentToken?: string;
  bookedAt: string;
  calledAt?: string;
  completedAt?: string;
}

export interface Procurement {
  id: string;
  tokenId: string;
  farmerId: string;
  centerId: string;
  commodity: string;
  quantity: number;
  qualityStatus: string;
  procurementStatus: string;
  paymentStatus: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  readAt?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export interface QueueUpdate {
  event: string;
  centerId: string;
  tokenId: string;
  position: number;
  estimatedWaitMinutes: number;
  currentToken: string;
  yourToken: string;
}