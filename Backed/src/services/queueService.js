import { getDb, inTransaction } from '../config/db.js';
import { env } from '../config/env.js';
import { tokenRepo } from '../repositories/tokenRepo.js';
import { statusHistoryRepo } from '../repositories/statusHistoryRepo.js';
import { auditRepo } from '../repositories/auditRepo.js';
import { procurementRepo } from '../repositories/procurementRepo.js';
import { notifyUser, notifyCenter } from './notificationService.js';
import { emitQueue, emitTokenStatus } from '../realtime/socket.js';
import { estimateWait } from '../ml/waitTime.js';
import { notFound, conflict, badRequest } from '../utils/errors.js';
import { todayStr } from '../utils/date.js';

export const TRANSITIONS = {
  BOOKED: ['WAITING', 'CANCELLED', 'RESCHEDULED'],
  WAITING: ['VERIFICATION', 'CANCELLED'],
  VERIFICATION: ['INSPECTION', 'PROCUREMENT', 'REJECTED', 'CANCELLED', 'WAITING'],
  INSPECTION: ['PROCUREMENT', 'VERIFICATION', 'REJECTED', 'CANCELLED'],
  PROCUREMENT: ['COMPLETED', 'REJECTED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  RESCHEDULED: [],
  REJECTED: [],
};

const ACTIVE = ['BOOKED', 'WAITING', 'VERIFICATION', 'INSPECTION'];

function waitFor(peopleAhead, activeCounters) {
  return estimateWait({
    peopleAhead,
    avgProcessMinutes: env.service.avgProcessMinutes,
    activeCounters,
  });
}

function buildQueueView(activeTokens, activeCounters) {
  const list = activeTokens.map((token, index) => {
    const position = index + 1;
    return {
      ...token,
      queue_position: position,
      estimated_wait_minutes: waitFor(index, activeCounters),
    };
  });
  const current = list[0] || null;
  return { list, current };
}

export const queueService = {
  getQueue(centerId, { date = todayStr() } = {}) {
    const db = getDb();
    const center = db.prepare('SELECT * FROM procurement_centers WHERE id = ?').get(centerId);
    const activeTokens = tokenRepo.listActiveByCenter(centerId, date);
    const { list, current } = buildQueueView(activeTokens, center?.active_counters || 1);
    return { centerId, date, currentToken: current?.token_number || null, tokens: list };
  },

  getQueueSummary(centerId, { date = todayStr() } = {}) {
    const db = getDb();
    const center = db.prepare('SELECT * FROM procurement_centers WHERE id = ?').get(centerId);
    const activeTokens = tokenRepo.listActiveByCenter(centerId, date);
    const { list, current } = buildQueueView(activeTokens, center?.active_counters || 1);

    const summary = {
      centerId,
      date,
      active: activeTokens.length,
      waiting: list.filter((t) => t.status === 'BOOKED' || t.status === 'WAITING').length,
      inVerification: list.filter((t) => t.status === 'VERIFICATION').length,
      inInspection: list.filter((t) => t.status === 'INSPECTION').length,
      inProcurement: list.filter((t) => t.status === 'PROCUREMENT').length,
      completed: 0,
      currentToken: current ? { id: current.id, tokenNumber: current.token_number, status: current.status, farmerName: current.farmer_name } : null,
      nextToken: list[1] ? { id: list[1].id, tokenNumber: list[1].token_number, status: list[1].status } : null,
      estimatedWaitMinutes: current ? current.estimated_wait_minutes : null,
    };

    const completedRow = db.prepare(
      "SELECT COUNT(*) AS c FROM tokens WHERE center_id = ? AND token_date = ? AND status = 'COMPLETED'",
    ).get(centerId, date);
    summary.completed = Number(completedRow.c);
    return summary;
  },

  getTokenStatus(tokenId) {
    const token = tokenRepo.findById(tokenId);
    if (!token) throw notFound('Token not found');
    const center = getDb().prepare('SELECT active_counters FROM procurement_centers WHERE id = ?').get(token.center_id);
    const history = statusHistoryRepo.listByToken(tokenId);
    return { ...token, history, live: queueService.getTokenLivePosition(token, center) };
  },

  getTokenLivePosition(token, center) {
    const active = tokenRepo.listActiveByCenter(token.center_id, token.token_date);
    const idx = active.findIndex((a) => a.id === token.id);
    if (idx === -1) {
      const done = ['COMPLETED', 'CANCELLED', 'RESCHEDULED', 'REJECTED'].includes(token.status);
      return { active: false, terminal: true, done, position: null, estimatedWaitMinutes: null };
    }
    return {
      active: true,
      terminal: false,
      done: false,
      position: idx + 1,
      currentToken: active[0]?.token_number || null,
      estimatedWaitMinutes: waitFor(idx, center.active_counters),
    };
  },

  callNext(user, centerId) {
    const token = inTransaction((db) => {
      const center = db.prepare('SELECT * FROM procurement_centers WHERE id = ?').get(centerId);
      if (!center) throw notFound('Center not found');
      const candidate = tokenRepo.firstEligible(centerId, todayStr());
      if (!candidate) return null;

      tokenRepo.markCalled(candidate.id);
      tokenRepo.setStatus(candidate.id, 'VERIFICATION');
      statusHistoryRepo.create({
        tokenId: candidate.id,
        oldStatus: candidate.status,
        newStatus: 'VERIFICATION',
        changedBy: user.id,
        reason: 'Called next farmer',
      });
      auditRepo.log({ userId: user.id, action: 'CALL_NEXT', entityType: 'token', entityId: candidate.id });

      queueService.recomputePositions(db, centerId, todayStr(), center);
      return tokenRepo.findById(candidate.id);
    });

    if (token) {
      notifyUser(token.farmer_id, {
        type: 'VERIFICATION_STARTED',
        title: 'Your turn is here',
        message: `Please proceed to the counter. Token ${token.token_number}.`,
        data: { tokenId: token.id },
      });
    }
    queueService.publishQueue(centerId);
    return token;
  },

  markArrived(user, tokenId) {
    return queueService.advanceStatus(user, tokenId, { status: 'WAITING', reason: 'Farmer marked as arrived' });
  },

  verifyFarmer(user, tokenId) {
    return queueService.advanceStatus(user, tokenId, { status: 'INSPECTION', reason: 'Identity verified by staff' });
  },

  advanceStatus(user, tokenId, { status, reason = null }) {
    let token;
    inTransaction((db) => {
      token = tokenRepo.findById(tokenId);
      if (!token) throw notFound('Token not found');
      const allowed = TRANSITIONS[token.status] || [];
      if (!allowed.includes(status)) {
        throw conflict('INVALID_TRANSITION', `Cannot move token from ${token.status} to ${status}`);
      }

      const center = db.prepare('SELECT * FROM procurement_centers WHERE id = ?').get(token.center_id);

      if (status === 'COMPLETED') {
        tokenRepo.markCompleted(tokenId);
        const procurement = procurementRepo.findByToken(tokenId);
        if (procurement) {
          procurementRepo.update(procurement.id, { procurement_status: 'COMPLETED', payment_status: 'PAID' });
        }
      } else {
        tokenRepo.setStatus(tokenId, status);
      }

      if (['CANCELLED', 'REJECTED', 'RESCHEDULED'].includes(status)) {
        db.prepare(
          "UPDATE slots SET available_slots = available_slots + 1, status = 'open', updated_at = ? WHERE id = ?",
        ).run(new Date().toISOString(), token.slot_id);
      }

      statusHistoryRepo.create({ tokenId, oldStatus: token.status, newStatus: status, changedBy: user.id, reason });
      auditRepo.log({ userId: user.id, action: 'UPDATE_STATUS', entityType: 'token', entityId: tokenId, metadata: { status, reason } });
      queueService.recomputePositions(db, token.center_id, token.token_date, center);
      return tokenRepo.findById(tokenId);
    });

    token = tokenRepo.findById(tokenId);
    queueService.notifyStatusChange(token);
    queueService.publishQueue(token.center_id);
    return token;
  },

  notifyStatusChange(token) {
    if (token.status === 'COMPLETED') {
      notifyUser(token.farmer_id, {
        type: 'PROCUREMENT_COMPLETED',
        title: 'Procurement completed',
        message: `Your procurement is complete. Thank you for using the service.`,
        data: { tokenId: token.id },
      });
    } else if (token.status === 'REJECTED') {
      notifyUser(token.farmer_id, {
        type: 'PROCUREMENT_REJECTED',
        title: 'Procurement rejected',
        message: 'Your procurement could not be completed. Please contact the center.',
        data: { tokenId: token.id },
      });
    } else {
      notifyUser(token.farmer_id, {
        type: 'STATUS_CHANGED',
        title: 'Status updated',
        message: `Your token ${token.token_number} is now ${token.status}.`,
        data: { tokenId: token.id },
      });
    }
    const center = getDb().prepare('SELECT active_counters FROM procurement_centers WHERE id = ?').get(token.center_id);
    const { position, currentToken, estimatedWaitMinutes } = queueService.getTokenLivePosition(token, center);
    emitTokenStatus(token.farmer_id, {
      tokenId: token.id,
      status: token.status,
      tokenNumber: token.token_number,
      position,
      currentToken,
      estimatedWaitMinutes,
    });
  },

  recomputePositions(db, centerId, date, center) {
    const active = tokenRepo.listActiveByCenter(centerId, date);
    active.forEach((t, index) => {
      tokenRepo.setQueuePosition(t.id, index + 1, waitFor(index, center.active_counters));
    });
  },

  publishQueue(centerId) {
    const summary = queueService.getQueueSummary(centerId);
    emitQueue(centerId, summary);
    return summary;
  },
};