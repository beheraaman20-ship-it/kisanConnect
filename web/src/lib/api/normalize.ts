import type {
  Notification,
  ProcurementCenter,
  Slot,
  Token,
  User,
  UserRole,
} from '@/lib/types';

export const mapUser = (row: any): User => ({
  id: String(row.id),
  name: row.name,
  mobile: row.mobile,
  role: (row.role ?? 'farmer') as UserRole,
  address: row.address ?? undefined,
  district: row.district ?? undefined,
  village: row.village ?? undefined,
});

const openStatus = (status: string | null | undefined): string =>
  status === 'active' || status?.toUpperCase() === 'OPEN' ? 'OPEN' : 'CLOSED';

export const mapCenter = (row: any): ProcurementCenter => ({
  id: String(row.id),
  name: row.name,
  location: row.location,
  district: row.district,
  latitude: Number(row.latitude),
  longitude: Number(row.longitude),
  dailyCapacity: Number(row.daily_capacity),
  status: openStatus(row.status),
  distance:
    row.distanceKm != null ? Number(row.distanceKm) : row.distance ?? undefined,
  currentQueueLength:
    row.activeQueue != null ? Number(row.activeQueue) : row.currentQueueLength,
  estimatedWaitMinutes:
    row.estimatedWaitMinutes != null ? Number(row.estimatedWaitMinutes) : undefined,
});

export const mapSlot = (row: any): Slot => ({
  id: String(row.id),
  centerId: String(row.center_id),
  date: row.token_date,
  startTime: row.start_time,
  endTime: row.end_time,
  capacity: Number(row.capacity),
  availableSlots: Number(row.available_slots),
  status: (row.status ?? 'open').toUpperCase(),
});

export const mapToken = (row: any): Token => {
  const live = row.live;
  const useLive = live?.active === true;
  return {
    id: String(row.id),
    tokenNumber: row.token_number,
    farmerId: String(row.farmer_id),
    centerId: String(row.center_id),
    slotId: String(row.slot_id),
    status: row.status,
    queuePosition: useLive ? Number(live.position) : Number(row.queue_position ?? 0),
    estimatedWaitTime: useLive
      ? Number(live.estimatedWaitMinutes ?? 0)
      : Number(row.estimated_wait_minutes ?? 0),
    currentToken: useLive ? live.currentToken : undefined,
    bookedAt: row.booked_at,
    calledAt: row.called_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
  };
};

export interface Booking {
  id: string;
  tokenNumber: string;
  centerId: string;
  centerName?: string;
  status: string;
  date?: string;
  bookedAt?: string;
  startTime?: string;
  endTime?: string;
}

export const mapBooking = (row: any): Booking => ({
  id: String(row.id),
  tokenNumber: row.token_number,
  centerId: String(row.center_id),
  centerName: row.center_name ?? undefined,
  status: row.status,
  date: row.token_date ?? row.slot_date ?? undefined,
  bookedAt: row.booked_at ?? undefined,
  startTime: row.start_time ?? undefined,
  endTime: row.end_time ?? undefined,
});

export const mapNotification = (row: any): Notification => {
  let parsedData: Record<string, unknown> | undefined;
  if (row.data) {
    try {
      parsedData = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    } catch {
      parsedData = undefined;
    }
  }
  return {
    id: String(row.id),
    userId: String(row.user_id),
    type: row.type,
    title: row.title,
    message: row.message,
    data: parsedData,
    readAt: row.read_at ?? undefined,
    createdAt: row.created_at,
  };
};