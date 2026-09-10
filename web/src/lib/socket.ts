import { io, type Socket } from 'socket.io-client';
import { env } from '@/env';
import { storage } from '@/lib/storage';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (socket?.connected) return socket;

  const token = storage.getToken();

  socket = io(env.SOCKET_URL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinCenterRoom = (centerId: string): void => {
  socket?.emit('join:center', { centerId });
};

export const leaveCenterRoom = (centerId: string): void => {
  socket?.emit('leave:center', { centerId });
};