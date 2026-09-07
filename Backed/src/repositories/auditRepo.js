import { getDb } from '../config/db.js';

export const auditRepo = {
  log({ userId = null, action, entityType = null, entityId = null, metadata = null }) {
    return getDb().prepare(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?)',
    ).run(userId, action, entityType, entityId, metadata ? JSON.stringify(metadata) : null).lastInsertRowid;
  },

  list({ page = 1, perPage = 20 } = {}) {
    const db = getDb();
    const total = Number(db.prepare('SELECT COUNT(*) AS c FROM audit_logs').get().c);
    const rows = db.prepare(
      'SELECT * FROM audit_logs ORDER BY id DESC LIMIT ? OFFSET ?',
    ).all(perPage, (page - 1) * perPage);
    return { rows, total, page, perPage };
  },
};