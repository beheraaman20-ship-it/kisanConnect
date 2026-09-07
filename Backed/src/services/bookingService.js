import { getDb, inTransaction } from '../config/db.js';
import { env } from '../config/env.js';
import { slotRepo } from '../repositories/slotRepo.js';
import { tokenRepo } from '../repositories/tokenRepo.js';
import { centerRepo } from '../repositories/centerRepo.js';
import { statusHistoryRepo } from '../repositories/statusHistoryRepo.js';
import { auditRepo } from '../repositories/auditRepo.js';
import { notifyUser, notifyCenter } from './notificationService.js';
import { emitQueue, emitToCenter } from '../realtime/socket.js';
import { estimateWait } from '../ml/waitTime.js';
import { notFound, conflict, badRequest, forbidden } from '../utils/errors.js';

const ACTIVE = ['BOOKED', 'WAITING', 'VERIFICATION', 'INSPECTION'];

function forbiddenToken() {
  return forbidden('This token does not belong to the current user');
}

function checkNotDoubleBooked(db, farmerId, tokenDate) {
  const row = db.prepare(
    `SELECT id FROM tokens WHERE farmer_id = ? AND token_date = ? AND status IN (${ACTIVE.map(() => '?').join(',')}) LIMIT 1`,
  ).get(farmerId, tokenDate, ...ACTIVE);
  if (row) throw conflict('ALREADY_BOOKED', 'You already have an active booking for this date');
}

function reserveSlotCapacity(db, slotId) {
  const result = db.prepare(
    'UPDATE slots SET available_slots = available_slots - 1, updated_at = ? WHERE id = ? AND status = ? AND available_slots > 0',
  ).run(new Date().toISOString(), slotId, 'open');
  if (result.changes === 0) throw conflict('SLOT_FULL', 'The selected slot is no longer available');
  const slot = slotRepo.findById(slotId);
  if (Number(slot.available_slots) === 0) {
    db.prepare("UPDATE slots SET status = 'full', updated_at = ? WHERE id = ?").run(new Date().toISOString(), slotId);
  }
  return slot;
}

function releaseSlotCapacity(db, slotId) {
  const slot = slotRepo.findById(slotId);
  if (!slot) return;
  db.prepare(
    "UPDATE slots SET available_slots = available_slots + 1, status = 'open', updated_at = ? WHERE id = ?",
  ).run(new Date().toISOString(), slotId);
}

function computeQueuePosition(db, centerId, tokenDate) {
  const active = tokenRepo.countActive(centerId, tokenDate);
  return active + 1;
}

function tokenNumberFor(centerCode, seq) {
  return `${centerCode}-${String(seq).padStart(3, '0')}`;
}

export const bookingService = {
  bookSlot(user, { slotId }) {
    const token = inTransaction((db) => {
      const slot = slotRepo.findById(slotId);
      if (!slot) throw notFound('Slot not found');
      if (slot.status !== 'open' || Number(slot.available_slots) <= 0) {
        throw conflict('SLOT_FULL', 'The selected slot is no longer available');
      }
      checkNotDoubleBooked(db, user.id, slot.token_date);
      reserveSlotCapacity(db, slotId);

      const center = centerRepo.findById(slot.center_id);
      const seq = tokenRepo.nextSequence(slot.center_id, slot.token_date);
      const tokenNumber = tokenNumberFor(center.code, seq);
      const queuePosition = computeQueuePosition(db, slot.center_id, slot.token_date);
      const estimatedWaitMinutes = estimateWait({
        peopleAhead: queuePosition - 1,
        avgProcessMinutes: env.service.avgProcessMinutes,
        activeCounters: center.active_counters,
      });

      const created = tokenRepo.create({
        tokenNumber,
        tokenDate: slot.token_date,
        farmerId: user.id,
        centerId: slot.center_id,
        slotId,
        queuePosition,
        estimatedWaitMinutes,
      });

      statusHistoryRepo.create({ tokenId: created.id, oldStatus: null, newStatus: 'BOOKED', changedBy: user.id });
      auditRepo.log({ userId: user.id, action: 'BOOK_SLOT', entityType: 'token', entityId: created.id, metadata: { slotId, tokenNumber } });
      return created;
    });

    notifyUser(token.farmer_id, {
      type: 'BOOKING_CONFIRMED',
      title: 'Booking confirmed',
      message: `Your slot is booked. Token ${token.token_number} at ${token.center_name}.`,
      data: { tokenId: token.id },
    });
    notifyUser(token.farmer_id, {
      type: 'TOKEN_GENERATED',
      title: 'Digital token generated',
      message: `Your token number is ${token.token_number}. Queue position: ${token.queue_position}.`,
      data: { tokenId: token.id },
    });
    emitQueue(token.center_id, { centerId: token.center_id, tokenId: token.id, event: 'booked' });
    emitToCenter(token.center_id, 'slot.updated', { slotId });
    return token;
  },

  cancelBooking(user, tokenId) {
    let token;
    inTransaction((db) => {
      token = tokenRepo.findById(tokenId);
      if (!token) throw notFound('Token not found');
      if (token.farmer_id !== user.id) throw forbiddenToken();
      if (!['BOOKED', 'WAITING', 'VERIFICATION'].includes(token.status)) {
        throw conflict('INVALID_TRANSITION', `Cannot cancel a token in ${token.status} status`);
      }
      tokenRepo.setStatus(tokenId, 'CANCELLED');
      statusHistoryRepo.create({ tokenId, oldStatus: token.status, newStatus: 'CANCELLED', changedBy: user.id, reason: 'Cancelled by farmer' });
      releaseSlotCapacity(db, token.slot_id);
      auditRepo.log({ userId: user.id, action: 'CANCEL_BOOKING', entityType: 'token', entityId: tokenId });
    });

    notifyUser(user.id, {
      type: 'BOOKING_CANCELLED',
      title: 'Booking cancelled',
      message: `Token ${token.token_number} has been cancelled.`,
      data: { tokenId: token.id },
    });
    emitQueue(token.center_id, { centerId: token.center_id, event: 'cancelled' });
    return tokenRepo.findById(tokenId);
  },

  rescheduleBooking(user, tokenId, newSlotId) {
    let result;
    inTransaction((db) => {
      const oldToken = tokenRepo.findById(tokenId);
      if (!oldToken) throw notFound('Token not found');
      if (oldToken.farmer_id !== user.id) throw forbiddenToken();
      if (oldToken.status !== 'BOOKED' && oldToken.status !== 'WAITING') {
        throw conflict('INVALID_TRANSITION', `Cannot reschedule a token in ${oldToken.status} status`);
      }

      const newSlot = slotRepo.findById(newSlotId);
      if (!newSlot) throw notFound('Slot not found');
      if (newSlot.status !== 'open' || Number(newSlot.available_slots) <= 0) {
        throw conflict('SLOT_FULL', 'The new slot is no longer available');
      }
      checkNotDoubleBooked(db, user.id, newSlot.token_date);
      reserveSlotCapacity(db, newSlotId);

      tokenRepo.setStatus(tokenId, 'RESCHEDULED');
      statusHistoryRepo.create({ tokenId, oldStatus: oldToken.status, newStatus: 'RESCHEDULED', changedBy: user.id, reason: 'Rescheduled by farmer' });
      releaseSlotCapacity(db, oldToken.slot_id);

      const center = centerRepo.findById(newSlot.center_id);
      const seq = tokenRepo.nextSequence(newSlot.center_id, newSlot.token_date);
      const tokenNumber = tokenNumberFor(center.code, seq);
      const queuePosition = computeQueuePosition(db, newSlot.center_id, newSlot.token_date);
      const estimatedWaitMinutes = estimateWait({
        peopleAhead: queuePosition - 1,
        avgProcessMinutes: env.service.avgProcessMinutes,
        activeCounters: center.active_counters,
      });

      const created = tokenRepo.create({
        tokenNumber,
        tokenDate: newSlot.token_date,
        farmerId: user.id,
        centerId: newSlot.center_id,
        slotId: newSlotId,
        queuePosition,
        estimatedWaitMinutes,
      });
      statusHistoryRepo.create({ tokenId: created.id, oldStatus: null, newStatus: 'BOOKED', changedBy: user.id, reason: 'Rescheduled from cancelled token' });
      auditRepo.log({ userId: user.id, action: 'RESCHEDULE', entityType: 'token', entityId: tokenId, metadata: { newTokenId: created.id, newSlotId } });

      result = { oldToken: tokenRepo.findById(tokenId), newToken: created };
    });

    notifyUser(user.id, {
      type: 'BOOKING_RESCHEDULED',
      title: 'Booking rescheduled',
      message: `Rescheduled to token ${result.newToken.token_number} at ${result.newToken.center_name}.`,
      data: { tokenId: result.newToken.id },
    });
    emitQueue(result.oldToken.center_id, { centerId: result.oldToken.center_id, event: 'rescheduled' });
    return result;
  },
};