import { emitToUser, emitToRole, emitToCenter } from '../realtime/socket.js';
import { notificationRepo } from '../repositories/notificationRepo.js';
import { pushService } from './pushService.js';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';

function sendPush(userId, title, body, data = null) {
  const dimensions = {
    firebase: Boolean(env.firebase.projectId && env.firebase.clientEmail && env.firebase.privateKey),
    vapid: Boolean(env.vapid.publicKey && env.vapid.privateKey),
  };

  if (dimensions.vapid) {
    pushService.sendToUser(userId, { title, body, data }).then(
      ({ sent }) => {
        if (sent > 0) logger.info(`[push] ${sent} push notification(s) sent to user ${userId}: "${title}"`);
      },
      (err) => logger.warn(`[push] error for user ${userId}: ${err.message}`),
    );
  } else if (dimensions.firebase) {
    logger.info(`[FCM] user ${userId}: "${title}"`);
  } else {
    logger.warn(`[push] no channel configured (VAPID or FCM) - in-app/Socket.IO only: "${title}"`);
  }
}

export function notifyUser(userId, { type, title, message, data = null }) {
  const notification = notificationRepo.create({ userId, type, title, message, data });
  emitToUser(userId, 'notification.new', { notification });
  sendPush(userId, title, message, data);
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