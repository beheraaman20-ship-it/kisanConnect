import { useEffect, useState } from 'react';
import { getSocket, joinCenterRoom, leaveCenterRoom } from '../../../core/network/socket';
import { QueueUpdate } from '../../../core/types';

export const useLiveQueue = (centerId: string | undefined) => {
  const [queueData, setQueueData] = useState<QueueUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    if (!centerId) return;

    let active = true;

    const setupSocket = async () => {
      try {
        const socket = await getSocket();

        socket.on('connect', () => {
          if (active) {
            setIsConnected(true);
            setIsReconnecting(false);
            joinCenterRoom(centerId);
          }
        });

        socket.on('disconnect', () => {
          if (active) {
            setIsConnected(false);
            setIsReconnecting(true);
          }
        });

        socket.on('connect_error', () => {
          if (active) setIsReconnecting(true);
        });

        socket.on('queue.updated', (data: QueueUpdate) => {
          if (active) setQueueData(data);
        });

        socket.on('token.called', (data: QueueUpdate) => {
          if (active) setQueueData(data);
        });

        socket.on('token.status_changed', (data: QueueUpdate) => {
          if (active) setQueueData(data);
        });

        if (!socket.connected) {
          socket.connect();
        }
      } catch (error) {
        console.error('Socket setup failed:', error);
      }
    };

    setupSocket();

    return () => {
      active = false;
      leaveCenterRoom(centerId);
      // Do not disconnect globally, other observers may use it
    };
  }, [centerId]);

  return {
    queueData,
    isConnected,
    isReconnecting,
  };
};
