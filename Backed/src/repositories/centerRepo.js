import { getDb } from '../config/db.js';

const BASE_COLUMNS = 'id, code, name, location, district, latitude, longitude, daily_capacity, active_counters, status, created_at, updated_at';

export const centerRepo = {
  list({ district = null, status = null } = {}) {
    const db = getDb();
    const where = [];
    const values = [];
    if (district) {
      where.push('district = ?');
      values.push(district);
    }
    if (status) {
      where.push('status = ?');
      values.push(status);
    }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    return db.prepare(`SELECT ${BASE_COLUMNS} FROM procurement_centers ${clause} ORDER BY id`).all(...values);
  },

  findById(id) {
    return getDb().prepare(`SELECT ${BASE_COLUMNS} FROM procurement_centers WHERE id = ?`).get(id) || null;
  },

  findByCode(code) {
    return getDb().prepare(`SELECT ${BASE_COLUMNS} FROM procurement_centers WHERE code = ?`).get(code) || null;
  },

  create({ code, name, location = null, district = null, latitude = null, longitude = null, daily_capacity = 100, active_counters = 1, status = 'active' }) {
    const db = getDb();
    const now = new Date().toISOString();
    const result = db.prepare(
      'INSERT INTO procurement_centers (code, name, location, district, latitude, longitude, daily_capacity, active_counters, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(code, name, location, district, latitude, longitude, daily_capacity, active_counters, status, now, now);
    return this.findById(result.lastInsertRowid);
  },

  update(id, fields) {
    const db = getDb();
    const allowed = ['code', 'name', 'location', 'district', 'latitude', 'longitude', 'daily_capacity', 'active_counters', 'status'];
    const sets = [];
    const values = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }
    if (sets.length === 0) return this.findById(id);
    sets.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    db.prepare(`UPDATE procurement_centers SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  },

  delete(id) {
    return getDb().prepare('DELETE FROM procurement_centers WHERE id = ?').run(id).changes > 0;
  },

  findByStaff(userId) {
    return getDb().prepare(
      `SELECT pc.* FROM staff_center_assignments sca
       JOIN procurement_centers pc ON pc.id = sca.center_id
       WHERE sca.user_id = ?`,
    ).all(userId);
  },

  totalForStaff() {
    const row = getDb().prepare('SELECT COUNT(*) AS c FROM staff_center_assignments').get();
    return Number(row.c);
  },
};