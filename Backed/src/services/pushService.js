import webpush from 'web-push';
import { getDb } from '../config/db.js';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';

if (env.vapid.publicKey && env.vapid.privateKey) {
  webpush.setVapidDetails(env.vapid.subject, env.vapid.publicKey, env.vapid.privateKey);
}

function subscribe(userId, subscription) {
  const db = getDb();
  db.prepare(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, last_seen_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET
       p256dh = excluded.p256dh,
       auth = excluded.auth,
       user_id = excluded.user_id,
       last_seen_at = excluded.last_seen_at`,
  ).run(userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth, new Date().toISOString());
  return { subscribed: true };
}

function unsubscribe(userId, { endpoint }) {
  if (!endpoint) return { unsubscribed: false };
  const result = getDb().prepare('DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?').run(userId, endpoint);
  return { unsubscribed: result.changes > 0 };
}

async function sendToUser(userId, { title, body, data = null }) {
  if (!env.vapid.publicKey || !env.vapid.privateKey) {
    logger.warn('[push] VAPID keys not configured, skipping web push');
    return { sent: 0 };
  }
  const rows = getDb().prepare('SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?').all(userId);
  if (!rows.length) return { sent: 0 };

  const payload = JSON.stringify({ title, body, data });
  let sent = 0;
  const stale = [];

  for (const row of rows) {
    try {
      await webpush.sendNotification(
        { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
        payload,
      );
      sent += 1;
    } catch (err) {
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        stale.push(row.id);
      } else {
        logger.warn(`[push] send failed for subscription ${row.id}: ${err.message}`);
      }
    }
  }

  if (stale.length) {
    const db = getDb();
    const placeholders = stale.map(() => '?').join(',');
    db.prepare(`DELETE FROM push_subscriptions WHERE id IN (${placeholders})`).run(...stale);
  }

  return { sent, removed: stale.length };
}

export const pushService = { subscribe, unsubscribe, sendToUser };

export const getVapidPublicKey = () => env.vapid.publicKey;