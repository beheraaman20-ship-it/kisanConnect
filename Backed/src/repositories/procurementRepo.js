import { getDb } from '../config/db.js';

const SELECT = `
  SELECT p.id, p.token_id, p.farmer_id, p.center_id, p.commodity, p.quantity, p.unit,
         p.quality_status, p.procurement_status, p.payment_status, p.notes, p.created_at, p.updated_at,
         t.token_number, u.name AS farmer_name, u.mobile AS farmer_mobile
  FROM procurement p
  JOIN tokens t ON t.id = p.token_id
  JOIN users u ON u.id = p.farmer_id
`;

export const procurementRepo = {
  create({ tokenId, farmerId, centerId, commodity = null, quantity = null, unit = null, qualityStatus = 'pending', notes = null }) {
    const db = getDb();
    const now = new Date().toISOString();
    const result = db.prepare(
      'INSERT INTO procurement (token_id, farmer_id, center_id, commodity, quantity, unit, quality_status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).run(tokenId, farmerId, centerId, commodity, quantity, unit, qualityStatus, notes, now, now);
    return this.findById(result.lastInsertRowid);
  },

  findById(id) {
    return getDb().prepare(`${SELECT} WHERE p.id = ?`).get(id) || null;
  },

  findByToken(tokenId) {
    return getDb().prepare(`${SELECT} WHERE p.token_id = ?`).get(tokenId) || null;
  },

  update(id, fields) {
    const db = getDb();
    const allowed = ['commodity', 'quantity', 'unit', 'quality_status', 'procurement_status', 'payment_status', 'notes'];
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
    db.prepare(`UPDATE procurement SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  },

  listByCenter(centerId, { tokenDate = null, page = 1, perPage = 20 } = {}) {
    const db = getDb();
    const where = ['p.center_id = ?'];
    const values = [centerId];
    if (tokenDate) {
      where.push('t.token_date = ?');
      values.push(tokenDate);
    }
    const clause = `WHERE ${where.join(' AND ')}`;
    const total = Number(db.prepare(`SELECT COUNT(*) AS c FROM procurement p JOIN tokens t ON t.id = p.token_id ${clause}`).get(...values).c);
    const rows = db.prepare(`${SELECT} ${clause} ORDER BY p.id DESC LIMIT ? OFFSET ?`).all(...values, perPage, (page - 1) * perPage);
    return { rows, total, page, perPage };
  },

  listByFarmer(farmerId, { page = 1, perPage = 20 } = {}) {
    const db = getDb();
    const total = Number(db.prepare('SELECT COUNT(*) AS c FROM procurement WHERE farmer_id = ?').get(farmerId).c);
    const rows = db.prepare(`${SELECT} WHERE p.farmer_id = ? ORDER BY p.id DESC LIMIT ? OFFSET ?`).all(farmerId, perPage, (page - 1) * perPage);
    return { rows, total, page, perPage };
  },
};