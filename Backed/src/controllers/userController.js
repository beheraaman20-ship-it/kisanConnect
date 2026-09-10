import { getDb } from '../config/db.js';
import { queueService } from '../services/queueService.js';
import { pushService, getVapidPublicKey } from '../services/pushService.js';
import { notificationRepo } from '../repositories/notificationRepo.js';
import { parsePagination, paginateMeta } from '../utils/pagination.js';
import { notFound, badRequest } from '../utils/errors.js';
import { success } from '../utils/response.js';

export const queueController = {
  get(req, res) {
    const { id } = req.params;
    const { date } = req.query;
    const queue = queueService.getQueue(Number(id), { date: date || undefined });
    const summary = queueService.getQueueSummary(Number(id), { date: date || undefined });
    return success(res, { ...queue, summary });
  },

  summary(req, res) {
    const { id } = req.params;
    const { date } = req.query;
    const summary = queueService.getQueueSummary(Number(id), { date: date || undefined });
    return success(res, { summary });
  },
};

export const userController = {
  registerDevice(req, res) {
    const db = getDb();
    db.prepare(
      `INSERT INTO devices (user_id, fcm_token, platform, last_seen_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(fcm_token) DO UPDATE SET user_id = excluded.user_id, platform = excluded.platform, last_seen_at = excluded.last_seen_at`,
    ).run(req.user.id, req.body.fcmToken, req.body.platform || 'unknown', new Date().toISOString());
    return success(res, { registered: true }, 'Device registered for notifications');
  },

  subscribePush(req, res) {
    const { subscription, device } = req.body;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      throw badRequest('VALIDATION_ERROR', 'Push subscription requires endpoint, p256dh and auth');
    }
    pushService.subscribe(req.user.id, subscription);
    if (device?.fcmToken) {
      const db = getDb();
      db.prepare(
        `INSERT INTO devices (user_id, fcm_token, platform, last_seen_at) VALUES (?, ?, ?, ?)
         ON CONFLICT(fcm_token) DO UPDATE SET user_id = excluded.user_id, platform = excluded.platform, last_seen_at = excluded.last_seen_at`,
      ).run(req.user.id, device.fcmToken, device.platform || 'unknown', new Date().toISOString());
    }
    return success(res, { subscribed: true, vapidPublicKey: getVapidPublicKey() }, 'Push notifications enabled');
  },

  unsubscribePush(req, res) {
    const result = pushService.unsubscribe(req.user.id, req.body);
    return success(res, result, 'Push notifications disabled');
  },

  listNotifications(req, res) {
    const { page, perPage } = parsePagination(req.query);
    const unreadOnly = req.query.unread === 'true';
    const result = notificationRepo.listByUser(req.user.id, { page, perPage, unreadOnly });
    const { rows, total, unread } = result;
    return success(res, { notifications: rows, unreadCount: unread, meta: paginateMeta(total, page, perPage) });
  },

  markRead(req, res) {
    const ok = notificationRepo.markRead(Number(req.params.id), req.user.id);
    if (!ok) throw notFound('Notification not found');
    return success(res, { read: true }, 'Notification marked as read');
  },

  markAllRead(req, res) {
    notificationRepo.markAllRead(req.user.id);
    return success(res, { read: true }, 'All notifications marked as read');
  },
};