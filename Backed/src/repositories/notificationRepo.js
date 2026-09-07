import { getDb } from '../config/db.js';

export const notificationRepo = {
  create({ userId, type, title, message, data = null }) {
    const db = getDb();
    const result = db.prepare(
      'INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)',
    ).run(userId, type, title, message, data ? JSON.stringify(data) : null);
    return this.findById(result.lastInsertRowid);
  },

  findById(id) {
    return getDb().prepare(
      'SELECT id, user_id, type, title, message, data, read_at, created_at FROM notifications WHERE id = ?',
    ).get(id) || null;
  },

  listByUser(userId, { page = 1, perPage = 20, unreadOnly = false } = {}) {
    const db = getDb();
    const where = ['user_id = ?'];
    const values = [userId];
    if (unreadOnly) where.push('read_at IS NULL');
    const clause = `WHERE ${where.join(' AND ')}`;
    const total = Number(db.prepare(`SELECT COUNT(*) AS c FROM notifications ${clause}`).get(...values).c);
    const rows = db.prepare(
      `SELECT id, user_id, type, title, message, data, read_at, created_at FROM notifications ${clause} ORDER BY id DESC LIMIT ? OFFSET ?`,
    ).all(...values, perPage, (page - 1) * perPage);
    return { rows, total, page, perPage, unread: this.unreadCount(userId) };
  },

  unreadCount(userId) {
    const row = getDb().prepare('SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read_at IS NULL').get(userId);
    return Number(row.c);
  },

  markRead(id, userId) {
    const db = getDb();
    const result = db.prepare('UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ?').run(
      new Date().toISOString(),
      id,
      userId,
    );
    return result.changes > 0;
  },

  markAllRead(userId) {
    getDb().prepare('UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL').run(
      new Date().toISOString(),
      userId,
    );
  },
};