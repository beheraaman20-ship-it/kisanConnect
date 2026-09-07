import { getDb } from '../config/db.js';

export const userRepo = {
  findById(id) {
    return getDb().prepare(
      'SELECT id, name, mobile, role, address, district, village, created_at, updated_at FROM users WHERE id = ?',
    ).get(id) || null;
  },

  findByMobile(mobile) {
    return getDb().prepare(
      'SELECT id, name, mobile, role, address, district, village, created_at, updated_at FROM users WHERE mobile = ?',
    ).get(mobile) || null;
  },

  create({ name, mobile, role = 'farmer', district = null, village = null, address = null }) {
    const db = getDb();
    const now = new Date().toISOString();
    const result = db.prepare(
      'INSERT INTO users (name, mobile, role, district, village, address, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(name, mobile, role, district, village, address, now, now);
    return this.findById(result.lastInsertRowid);
  },

  update(id, fields) {
    const db = getDb();
    const allowed = ['name', 'district', 'village', 'address'];
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
    db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  },

  list({ role = null, search = null, page = 1, perPage = 20 } = {}) {
    const db = getDb();
    const where = [];
    const values = [];
    if (role) {
      where.push('role = ?');
      values.push(role);
    }
    if (search) {
      where.push('(name LIKE ? OR mobile LIKE ?)');
      values.push(`%${search}%`, `%${search}%`);
    }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const totalRow = db.prepare(`SELECT COUNT(*) AS c FROM users ${clause}`).get(...values);
    const rows = db.prepare(
      `SELECT id, name, mobile, role, address, district, village, created_at, updated_at
       FROM users ${clause} ORDER BY id DESC LIMIT ? OFFSET ?`,
    ).run(...values, perPage, (page - 1) * perPage).changes;
    void rows;
    const data = db.prepare(
      `SELECT id, name, mobile, role, address, district, village, created_at, updated_at
       FROM users ${clause} ORDER BY id DESC LIMIT ? OFFSET ?`,
    ).all(...values, perPage, (page - 1) * perPage);
    return { rows: data, total: Number(totalRow.c) };
  },

  countByRole(role) {
    const row = getDb().prepare('SELECT COUNT(*) AS c FROM users WHERE role = ?').get(role);
    return Number(row.c);
  },
};