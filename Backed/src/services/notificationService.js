import { emitToUser, emitToRole, emitToCenter } from '../realtime/socket.js';
import { notificationRepo } from '../repositories/notificationRepo.js';
import { getDb } from '../config/db.js';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';

function sendPush(userId, title, body) {
  if (env.firebase.projectId && env.firebase.clientEmail && env.firebase.privateKey) {
    logger.info(`[FCM] user ${userId}: "${title}"`);
    return;
  }
  const rows = getDb().prepare('SELECT fcm_token FROM devices WHERE user_id = ?').all(userId);
  if (rows.length) {
    logger.info(`[FCM-stub] ${rows.length} device(s) for user ${userId}: "${title}"`);
  }
  void body;
}

export function notifyUser(userId, { type, title, message, data = null }) {
  const notification = notificationRepo.create({ userId, type, title, message, data });
  emitToUser(userId, 'notification.new', { notification });
  sendPush(userId, title, message);
  return notification;
}

export function notifyCenter(centerId, { type, title, message, data = null }) {
  emitToCenter(centerId, 'notification.new', { type, title, message, data });
  logger.info(`[center-notify] center ${centerId}: "${title}"`);
}

export function notifyRole(role, { type, title, message, data = null }) {
  emitToRole(role, 'notification.new', { type, title, message, data });
  logger.info(`[role-notify] ${role}: "${title}"`);
}