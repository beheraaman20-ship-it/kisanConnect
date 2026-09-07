import { getDb } from '../config/db.js';

export const statusHistoryRepo = {
  create({ tokenId = null, procurementId = null, oldStatus = null, newStatus, changedBy = null, reason = null }) {
    const db = getDb();
    const result = db.prepare(
      'INSERT INTO status_history (token_id, procurement_id, old_status, new_status, changed_by, reason) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(tokenId, procurementId, oldStatus, newStatus, changedBy, reason);
    return result.lastInsertRowid;
  },

  listByToken(tokenId) {
    return getDb().prepare(
      'SELECT id, token_id, old_status, new_status, changed_by, reason, created_at FROM status_history WHERE token_id = ? ORDER BY id',
    ).all(tokenId);
  },

  listByProcurement(procurementId) {
    return getDb().prepare(
      'SELECT id, procurement_id, old_status, new_status, changed_by, reason, created_at FROM status_history WHERE procurement_id = ? ORDER BY id',
    ).all(procurementId);
  },
};