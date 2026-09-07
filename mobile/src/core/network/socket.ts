import { io, Socket } from 'socket.io-client';
import { env } from '../config/env';
import { secureStorage } from '../storage/secureStorage';

let socket: Socket | null = null;

export const getSocket = async (): Promise<Socket> => {
  if (socket?.connected) return socket;

  const token = await secureStorage.getToken();

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

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinCenterRoom = (centerId: string) => {
  socket?.emit('join:center', { centerId });
};

export const leaveCenterRoom = (centerId: string) => {
  socket?.emit('leave:center', { centerId });
};
