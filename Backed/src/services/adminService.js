import { getDb, inTransaction } from '../config/db.js';
import { userRepo } from '../repositories/userRepo.js';
import { centerRepo } from '../repositories/centerRepo.js';
import { slotRepo } from '../repositories/slotRepo.js';
import { tokenRepo } from '../repositories/tokenRepo.js';
import { procurementRepo } from '../repositories/procurementRepo.js';
import { auditRepo } from '../repositories/auditRepo.js';
import { notFound, badRequest } from '../utils/errors.js';
import { todayStr } from '../utils/date.js';

const count = (sql, ...args) => Number(getDb().prepare(sql).get(...args).c);

export const adminService = {
  dashboard() {
    const db = getDb();
    const today = todayStr();
    const recentTokens = db.prepare(
      `SELECT t.id, t.token_number, t.status, t.token_date, t.queue_position,
              u.name AS farmer_name, u.mobile AS farmer_mobile, pc.name AS center_name
       FROM tokens t
       JOIN users u ON u.id = t.farmer_id
       JOIN procurement_centers pc ON pc.id = t.center_id
       ORDER BY t.id DESC LIMIT 10`,
    ).all();

    return {
      users: {
        farmers: userRepo.countByRole('farmer'),
        staff: userRepo.countByRole('staff'),
        admins: userRepo.countByRole('admin'),
      },
      centers: {
        total: centerRepo.list().length,
        active: centerRepo.list({ status: 'active' }).length,
      },
      today: {
        tokens: count('SELECT COUNT(*) FROM tokens WHERE token_date = ?', today),
        active: db.prepare(
          'SELECT COUNT(*) AS c FROM tokens WHERE token_date = ? AND status IN (?, ?, ?, ?)',
        ).get(today, 'BOOKED', 'WAITING', 'VERIFICATION', 'INSPECTION').c,
        completed: count("SELECT COUNT(*) FROM tokens WHERE token_date = ? AND status = 'COMPLETED'", today),
      },
      procurements: {
        total: count('SELECT COUNT(*) FROM procurement'),
        completed: count("SELECT COUNT(*) FROM procurement WHERE procurement_status = 'COMPLETED'"),
      },
      recentTokens,
    };
  },

  statistics() {
    const db = getDb();
    const today = todayStr();
    const totalTokens = count('SELECT COUNT(*) FROM tokens');
    const procured = count('SELECT COUNT(*) FROM tokens WHERE status = ?', 'COMPLETED');
    const cancelled = count('SELECT COUNT(*) FROM tokens WHERE status = ?', 'CANCELLED');
    const rescheduled = count('SELECT COUNT(*) FROM tokens WHERE status = ?', 'RESCHEDULED');
    const rejected = count('SELECT COUNT(*) FROM tokens WHERE status = ?', 'REJECTED');

    const utilizationRow = db.prepare(
      `SELECT COALESCE(SUM(capacity),0) AS total, COALESCE(SUM(capacity - available_slots),0) AS used FROM slots WHERE token_date = ?`,
    ).get(today);
    const activeWait = db.prepare(
      'SELECT AVG(estimated_wait_minutes) AS avg_wait FROM tokens WHERE token_date = ? AND status IN (?, ?, ?, ?)',
    ).get(today, 'BOOKED', 'WAITING', 'VERIFICATION', 'INSPECTION');

    const centers = centerRepo.list().map((c) => {
      const completed = count("SELECT COUNT(*) FROM tokens WHERE center_id = ? AND token_date = ? AND status = 'COMPLETED'", c.id, today);
      const active = count('SELECT COUNT(*) FROM tokens WHERE center_id = ? AND token_date = ? AND status IN (?,?,?,?)', c.id, today, 'BOOKED', 'WAITING', 'VERIFICATION', 'INSPECTION');
      const slot = db.prepare(
        'SELECT COALESCE(SUM(capacity),0) AS total, COALESCE(SUM(capacity - available_slots),0) AS used FROM slots WHERE center_id = ? AND token_date = ?',
      ).get(c.id, today);
      return {
        id: c.id,
        code: c.code,
        name: c.name,
        status: c.status,
        activeInQueue: active,
        completedToday: completed,
        slotUtilization: Number(slot.total) > 0 ? Number(((Number(slot.used) / Number(slot.total)) * 100).toFixed(1)) : 0,
      };
    });

    return {
      tokens: {
        total: totalTokens,
        completed: procured,
        cancelled,
        rescheduled,
        rejected,
        completionRate: totalTokens > 0 ? Number(((procured / totalTokens) * 100).toFixed(1)) : 0,
      },
      today: {
        date: today,
        slotUtilization: Number(utilizationRow.total) > 0 ? Number(((Number(utilizationRow.used) / Number(utilizationRow.total)) * 100).toFixed(1)) : 0,
        averageEstimateWaitMinutes: activeWait.avg_wait ? Math.round(Number(activeWait.avg_wait)) : 0,
      },
      perCenter: centers,
    };
  },

  createSlots(centerId, { tokenDate, times, capacity = 20 }) {
    if (!centerRepo.findById(centerId)) throw notFound('Center not found');
    if (!Array.isArray(times) || times.length === 0) throw badRequest('INVALID_TIMES', 'Provide at least one [start, end] time range');
    const count = slotRepo.createSlots(centerId, tokenDate, times, capacity);
    return { inserted: count };
  },

  updateSlot(id, fields) {
    if (!slotRepo.findById(id)) throw notFound('Slot not found');
    return slotRepo.update(id, fields);
  },

  assignStaff(userId, centerId) {
    const db = getDb();
    if (!userRepo.findById(userId)) throw notFound('Staff user not found');
    if (!centerRepo.findById(centerId)) throw notFound('Center not found');
    db.prepare(
      'INSERT INTO staff_center_assignments (user_id, center_id) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET center_id = excluded.center_id',
    ).run(userId, centerId);
    return { userId, centerId };
  },
};