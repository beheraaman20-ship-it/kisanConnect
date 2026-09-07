import { getDb } from '../config/db.js';

const BASE_COLUMNS = 'id, center_id, token_date, start_time, end_time, capacity, available_slots, status, created_at, updated_at';

export const slotRepo = {
  findById(id) {
    return getDb().prepare(`SELECT ${BASE_COLUMNS} FROM slots WHERE id = ?`).get(id) || null;
  },

  listByCenterDate(centerId, tokenDate) {
    return getDb().prepare(
      `SELECT ${BASE_COLUMNS} FROM slots WHERE center_id = ? AND token_date = ? ORDER BY start_time`,
    ).all(centerId, tokenDate);
  },

  listByCenterRange(centerId, fromDate, toDate) {
    return getDb().prepare(
      `SELECT ${BASE_COLUMNS} FROM slots WHERE center_id = ? AND token_date BETWEEN ? AND ? ORDER BY token_date, start_time`,
    ).all(centerId, fromDate, toDate);
  },

  createSlots(centerId, tokenDate, timeRanges, capacity) {
    const db = getDb();
    const insert = db.prepare(
      'INSERT INTO slots (center_id, token_date, start_time, end_time, capacity, available_slots) VALUES (?, ?, ?, ?, ?, ?)',
    );
    let count = 0;
    for (const [start, end] of timeRanges) {
      const existing = db.prepare('SELECT id FROM slots WHERE center_id = ? AND token_date = ? AND start_time = ?').get(centerId, tokenDate, start);
      if (existing) continue;
      insert.run(centerId, tokenDate, start, end, capacity, capacity);
      count += 1;
    }
    return count;
  },

  update(id, fields) {
    const db = getDb();
    const allowed = ['start_time', 'end_time', 'capacity', 'available_slots', 'status'];
    const sets = [];
    const values = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }
    sets.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    db.prepare(`UPDATE slots SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  },

  countTokensForSlot(slotId) {
    const row = getDb().prepare(
      'SELECT COUNT(*) AS c FROM tokens WHERE slot_id = ? AND status IN (?, ?, ?, ?)',
    ).get(slotId, 'BOOKED', 'WAITING', 'VERIFICATION', 'INSPECTION');
    return Number(row.c);
  },
};