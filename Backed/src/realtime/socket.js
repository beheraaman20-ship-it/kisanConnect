import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { getDb } from '../config/db.js';
import { unauthorized } from '../utils/errors.js';

let ioInstance = null;

export function initSocket(httpServer) {
  ioInstance = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  ioInstance.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return next(unauthorized('Socket authentication required'));
    try {
      const payload = jwt.verify(token, env.jwt.secret);
      socket.user = payload;
      return next();
    } catch (err) {
      return next(unauthorized('Invalid token'));
    }
  });

  ioInstance.on('connection', (socket) => {
    const user = socket.user;
    socket.join(`user:${user.id}`);
    socket.join(`role:${user.role}`);
    if (user.role === 'staff') {
      const row = getDb().prepare('SELECT center_id FROM staff_center_assignments WHERE user_id = ?').get(user.id);
      if (row) socket.join(`center:${row.center_id}`);
    }
  });

  return ioInstance;
}

export function getIO() {
  return ioInstance;
}

export function emitToUser(userId, event, payload) {
  getIO()?.to(`user:${userId}`).emit(event, payload);
}

export function emitToRole(role, event, payload) {
  getIO()?.to(`role:${role}`).emit(event, payload);
}

export function emitToCenter(centerId, event, payload) {
  if (!centerId) return;
  getIO()?.to(`center:${centerId}`).emit(event, payload);
}

export function emitQueue(centerId, payload) {
  emitToCenter(centerId, 'queue.updated', payload);
}

export function emitTokenStatus(userId, payload) {
  emitToUser(userId, 'token.status_changed', payload);
}