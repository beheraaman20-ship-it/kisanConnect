import { bookingService } from '../services/bookingService.js';
import { slotRepo } from '../repositories/slotRepo.js';
import { notFound } from '../utils/errors.js';
import { success, created } from '../utils/response.js';

function resolveSlotId(body) {
  return body.slotId ?? body.slot_id;
}

export const bookingController = {
  getSlot(req, res) {
    const slot = slotRepo.findById(Number(req.params.id));
    if (!slot) throw notFound('Slot not found');
    return success(res, { slot });
  },

  book(req, res) {
    const token = bookingService.bookSlot(req.user, { slotId: resolveSlotId(req.body) });
    return created(res, { token }, 'Slot booked successfully');
  },

  cancel(req, res) {
    const token = bookingService.cancelBooking(req.user, Number(req.params.id));
    return success(res, { token }, 'Booking cancelled');
  },

  reschedule(req, res) {
    const result = bookingService.rescheduleBooking(
      req.user,
      Number(req.params.id),
      resolveSlotId(req.body),
    );
    return success(res, result, 'Booking rescheduled');
  },
};