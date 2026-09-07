import { getDb } from '../config/db.js';

export const ACTIVE_STATUSES = ['BOOKED', 'WAITING', 'VERIFICATION', 'INSPECTION'];

const TOKEN_SELECT = `
  SELECT t.id, t.token_number, t.token_date, t.farmer_id, t.center_id, t.slot_id, t.status,
         t.queue_position, t.estimated_wait_minutes, t.booked_at, t.called_at, t.completed_at,
         u.name AS farmer_name, u.mobile AS farmer_mobile,
         pc.code AS center_code, pc.name AS center_name,
         s.token_date AS slot_date, s.start_time, s.end_time
  FROM tokens t
  JOIN users u ON u.id = t.farmer_id
  JOIN procurement_centers pc ON pc.id = t.center_id
  JOIN slots s ON s.id = t.slot_id
`;

export const tokenRepo = {
  findById(id) {
    return getDb().prepare(`${TOKEN_SELECT} WHERE t.id = ?`).get(id) || null;
  },

  findByNumberAndCenter(tokenNumber, centerId) {
    return getDb().prepare(`${TOKEN_SELECT} WHERE t.token_number = ? AND t.center_id = ?`).get(tokenNumber, centerId) || null;
  },

  create({ tokenNumber, tokenDate, farmerId, centerId, slotId, status = 'BOOKED', queuePosition = null, estimatedWaitMinutes = null }) {
    const db = getDb();
    const now = new Date().toISOString();
    const result = db.prepare(
      'INSERT INTO tokens (token_number, token_date, farmer_id, center_id, slot_id, status, queue_position, estimated_wait_minutes, booked_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(tokenNumber, tokenDate, farmerId, centerId, slotId, status, queuePosition, estimatedWaitMinutes, now, now, now);
    return this.findById(result.lastInsertRowid);
  },

  nextSequence(centerId, tokenDate) {
    const db = getDb();
    db.prepare(
      'INSERT OR IGNORE INTO token_sequences (center_id, token_date, last_seq) VALUES (?, ?, 0)',
    ).run(centerId, tokenDate);
    db.prepare(
      'UPDATE token_sequences SET last_seq = last_seq + 1 WHERE center_id = ? AND token_date = ?',
    ).run(centerId, tokenDate);
    const row = db.prepare('SELECT last_seq FROM token_sequences WHERE center_id = ? AND token_date = ?').get(centerId, tokenDate);
    return Number(row.last_seq);
  },

  countActive(centerId, tokenDate) {
    const db = getDb();
    const row = db.prepare(
      `SELECT COUNT(*) AS c FROM tokens WHERE center_id = ? AND token_date = ? AND status IN (${ACTIVE_STATUSES.map(() => '?').join(',')})`,
    ).get(centerId, tokenDate, ...ACTIVE_STATUSES);
    return Number(row.c);
  },

  countActiveForSlot(slotId) {
    const db = getDb();
    const row = db.prepare(
      `SELECT COUNT(*) AS c FROM tokens WHERE slot_id = ? AND status IN (${ACTIVE_STATUSES.map(() => '?').join(',')})`,
    ).get(slotId, ...ACTIVE_STATUSES);
    return Number(row.c);
  },

  listActiveByCenter(centerId, tokenDate) {
    return getDb().prepare(
      `${TOKEN_SELECT} WHERE t.center_id = ? AND t.token_date = ?
       AND t.status IN (${ACTIVE_STATUSES.map(() => '?').join(',')})
       ORDER BY t.id`,
    ).all(centerId, tokenDate, ...ACTIVE_STATUSES);
  },

  listByCenterDate(centerId, tokenDate) {
    return getDb().prepare(
      `${TOKEN_SELECT} WHERE t.center_id = ? AND t.token_date = ? ORDER BY t.id`,
    ).all(centerId, tokenDate);
  },

  firstEligible(centerId, tokenDate) {
    return getDb().prepare(
      `SELECT * FROM tokens WHERE center_id = ? AND token_date = ? AND status IN (?, ?) ORDER BY id LIMIT 1`,
    ).get(centerId, tokenDate, 'BOOKED', 'WAITING') || null;
  },

  setStatus(id, status, { queuePosition = null, estimatedWaitMinutes = null } = {}) {
    const db = getDb();
    const sets = ['status = ?', 'updated_at = ?'];
    const values = [status, new Date().toISOString()];
    if (estimatedWaitMinutes !== null) {
      sets.push('estimated_wait_minutes = ?');
      values.push(estimatedWaitMinutes);
    }
    if (queuePosition !== null) {
      sets.push('queue_position = ?');
      values.push(queuePosition);
    }
    values.push(id);
    db.prepare(`UPDATE tokens SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  },

  setQueuePosition(id, position, estimatedWaitMinutes) {
    getDb().prepare(
      'UPDATE tokens SET queue_position = ?, estimated_wait_minutes = ?, updated_at = ? WHERE id = ?',
    ).run(position, estimatedWaitMinutes, new Date().toISOString(), id);
  },

  markCalled(id) {
    return getDb().prepare("UPDATE tokens SET called_at = ?, updated_at = ? WHERE id = ?").run(
      new Date().toISOString(),
      new Date().toISOString(),
      id,
    ).changes > 0;
  },

  markCompleted(id) {
    return getDb().prepare("UPDATE tokens SET completed_at = ?, status = 'COMPLETED', updated_at = ? WHERE id = ?").run(
      new Date().toISOString(),
      new Date().toISOString(),
      id,
    ).changes > 0;
  },

  listByFarmer(farmerId, { page = 1, perPage = 20 } = {}) {
    const db = getDb();
    const total = Number(db.prepare('SELECT COUNT(*) AS c FROM tokens WHERE farmer_id = ?').get(farmerId).c);
    const rows = db.prepare(
      `${TOKEN_SELECT} WHERE t.farmer_id = ? ORDER BY t.id DESC LIMIT ? OFFSET ?`,
    ).all(farmerId, perPage, (page - 1) * perPage);
    return { rows, total, page, perPage };
  },

  listForSlot(slotId) {
    return getDb().prepare(`${TOKEN_SELECT} WHERE t.slot_id = ? ORDER BY t.id`).all(slotId);
  },
};