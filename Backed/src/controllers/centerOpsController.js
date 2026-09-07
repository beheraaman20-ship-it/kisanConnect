import { queueService } from '../services/queueService.js';
import { procurementService } from '../services/procurementService.js';
import { tokenRepo } from '../repositories/tokenRepo.js';
import { procurementRepo } from '../repositories/procurementRepo.js';
import { notFound, forbidden } from '../utils/errors.js';
import { success, created } from '../utils/response.js';

function staffCenterId(req) {
  if (req.user.role === 'admin') return req.body.centerId ?? Number(req.params.centerId) ?? req.staffCenterId;
  return req.staffCenterId;
}

function ensureCenterMatch(req, token) {
  const centerId = staffCenterId(req);
  if (token.center_id !== centerId) {
    throw forbidden('Token belongs to a different center');
  }
}

export const centerOpsController = {
  todayQueue(req, res) {
    const centerId = staffCenterId(req);
    const queue = queueService.getQueue(centerId);
    const tokens = queue.tokens.map((t) => {
      const procurement = procurementRepo.findByToken(t.id);
      return { ...t, procurement };
    });
    const summary = queueService.getQueueSummary(centerId);
    return success(res, { centerId, date: queue.date, currentToken: queue.currentToken, tokens, summary });
  },

  callNext(req, res) {
    const token = queueService.callNext(req.user, staffCenterId(req));
    if (!token) return success(res, { token: null }, 'No eligible tokens in the queue');
    return success(res, { token }, 'Next farmer called');
  },

  markArrived(req, res) {
    const token = tokenRepo.findById(Number(req.params.id));
    if (!token) throw notFound('Token not found');
    ensureCenterMatch(req, token);
    const updated = queueService.markArrived(req.user, token.id);
    return success(res, { token: updated }, 'Farmer marked as arrived');
  },

  verify(req, res) {
    const token = tokenRepo.findById(Number(req.params.id));
    if (!token) throw notFound('Token not found');
    ensureCenterMatch(req, token);
    const updated = queueService.verifyFarmer(req.user, token.id);
    return success(res, { token: updated }, 'Farmer verified');
  },

  advanceStatus(req, res) {
    const token = tokenRepo.findById(Number(req.params.id));
    if (!token) throw notFound('Token not found');
    ensureCenterMatch(req, token);
    const updated = queueService.advanceStatus(req.user, token.id, {
      status: req.body.status,
      reason: req.body.reason,
    });
    return success(res, { token: updated }, 'Token status updated');
  },

  recordProcurement(req, res) {
    const token = tokenRepo.findById(Number(req.params.id));
    if (!token) throw notFound('Token not found');
    ensureCenterMatch(req, token);
    const body = req.body;
    const result = procurementService.record(req.user, token.id, {
      commodity: body.commodity ?? body.commodity,
      quantity: body.quantity,
      unit: body.unit,
      qualityStatus: body.qualityStatus ?? body.quality_status,
      notes: body.notes,
    });
    return created(res, result, 'Procurement recorded');
  },

  completeProcurement(req, res) {
    const token = tokenRepo.findById(Number(req.params.id));
    if (!token) throw notFound('Token not found');
    ensureCenterMatch(req, token);
    const body = req.body;
    const completed = procurementService.complete(req.user, token.id, {
      commodity: body.commodity,
      quantity: body.quantity,
      unit: body.unit,
      qualityStatus: body.qualityStatus ?? body.quality_status,
      notes: body.notes,
    });
    return success(res, { token: completed }, 'Procurement completed');
  },
};