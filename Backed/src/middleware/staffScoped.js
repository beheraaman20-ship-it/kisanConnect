import { getDb } from '../config/db.js';
import { forbidden } from '../utils/errors.js';

export function staffScoped(req, res, next) {
  if (!req.user) return next(forbidden());
  const db = getDb();
  const row = db.prepare(
    'SELECT sca.*, pc.code, pc.name AS center_name FROM staff_center_assignments sca JOIN procurement_centers pc ON pc.id = sca.center_id WHERE sca.user_id = ?',
  ).get(req.user.id);
  if (!row && req.user.role !== 'admin') {
    return next(forbidden('Staff user is not assigned to any procurement center'));
  }
  req.staffAssignment = row || null;
  req.staffCenterId = row ? row.center_id : null;
  return next();
}