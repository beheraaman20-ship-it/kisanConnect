import { tokenRepo } from '../repositories/tokenRepo.js';
import { queueService } from '../services/queueService.js';
import { getDb } from '../config/db.js';
import { notFound, forbidden } from '../utils/errors.js';
import { success } from '../utils/response.js';

function ensureAccess(user, token) {
  const allowed =
    user.role === 'admin' ||
    token.farmer_id === user.id ||
    (user.role === 'staff' && reqStaffCenterMatches(user, token));
  if (!allowed) throw forbidden('You do not have access to this token');
}

function reqStaffCenterMatches(user, token) {
  return user.staffCenterId ? user.staffCenterId === token.center_id : false;
}

export const tokenController = {
  get(req, res) {
    const token = tokenRepo.findById(Number(req.params.id));
    if (!token) throw notFound('Token not found');
    ensureAccess(req.user, token);
    const center = getDb().prepare('SELECT active_counters FROM procurement_centers WHERE id = ?').get(token.center_id);
    const live = queueService.getTokenLivePosition(token, center);
    return success(res, { token: { ...token, live } });
  },

  status(req, res) {
    const data = queueService.getTokenStatus(Number(req.params.id));
    ensureAccess(req.user, data);
    return success(res, { token: data });
  },
};