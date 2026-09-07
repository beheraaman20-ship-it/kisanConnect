import { getDb, inTransaction } from '../config/db.js';
import { tokenRepo } from '../repositories/tokenRepo.js';
import { procurementRepo } from '../repositories/procurementRepo.js';
import { statusHistoryRepo } from '../repositories/statusHistoryRepo.js';
import { auditRepo } from '../repositories/auditRepo.js';
import { queueService } from './queueService.js';
import { notifyUser, notifyCenter } from './notificationService.js';
import { notFound, badRequest } from '../utils/errors.js';

export const procurementService = {
  record(user, tokenId, { commodity = null, quantity = null, unit = null, qualityStatus = 'pending', notes = null }) {
    const token = tokenRepo.findById(tokenId);
    if (!token) throw notFound('Token not found');

    const result = inTransaction((db) => {
      let procurement = procurementRepo.findByToken(tokenId);

      if (token.status !== 'INSPECTION' && token.status !== 'PROCUREMENT' && token.status !== 'VERIFICATION') {
        throw badRequest('INVALID_STATUS', `Cannot record procurement for token in ${token.status} status`);
      }

      if (procurement) {
        procurementRepo.update(procurement.id, { commodity, quantity, unit, quality_status: qualityStatus, notes });
      } else {
        procurement = procurementRepo.create({
          tokenId,
          farmerId: token.farmer_id,
          centerId: token.center_id,
          commodity,
          quantity,
          unit,
          qualityStatus,
          notes,
        });
      }

      if (qualityStatus === 'rejected') {
        tokenRepo.setStatus(tokenId, 'REJECTED');
        statusHistoryRepo.create({
          tokenId,
          oldStatus: token.status,
          newStatus: 'REJECTED',
          changedBy: user.id,
          reason: 'Produce quality rejected',
        });
        db.prepare(
          "UPDATE slots SET available_slots = available_slots + 1, status = 'open', updated_at = ? WHERE id = ?",
        ).run(new Date().toISOString(), token.slot_id);
      }

      auditRepo.log({
        userId: user.id,
        action: 'RECORD_PROCUREMENT',
        entityType: 'procurement',
        entityId: procurement.id,
        metadata: { tokenId, commodity, quantity, unit, qualityStatus },
      });
      return procurement;
    });

    if (qualityStatus === 'rejected') {
      const updated = tokenRepo.findById(tokenId);
      notifyUser(token.farmer_id, {
        type: 'PROCUREMENT_REJECTED',
        title: 'Procurement rejected',
        message: 'Your produce did not pass quality inspection.',
        data: { tokenId: token.id },
      });
      queueService.publishQueue(token.center_id);
      return { procurement: result, token: updated };
    }

    notifyCenter(token.center_id, {
      type: 'PROCUREMENT_RECORDED',
      title: 'Procurement recorded',
      message: `Token ${token.token_number}: ${commodity || 'commodity'} ${quantity ?? ''} ${unit || ''}`,
      data: { tokenId: token.id },
    });
    return { procurement: result, token: tokenRepo.findById(tokenId) };
  },

  complete(user, tokenId, data = {}) {
    const token = tokenRepo.findById(tokenId);
    if (!token) throw notFound('Token not found');
    if (token.status === 'INSPECTION' || token.status === 'PROCUREMENT') {
      const existing = procurementRepo.findByToken(tokenId);
      if (!existing) {
        procurementRepo.create({
          tokenId,
          farmerId: token.farmer_id,
          centerId: token.center_id,
          qualityStatus: 'pending',
          ...data,
        });
      }
    }
    const completed = queueService.advanceStatus(user, tokenId, { status: 'COMPLETED', reason: 'Procurement completed' });
    return completed;
  },
};