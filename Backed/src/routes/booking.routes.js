import { Router } from 'express';
import { bookingController } from '../controllers/bookingController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { bookSlotSchema, rescheduleSchema } from '../validators/booking.js';
import { wrap } from '../utils/asyncHandler.js';

const router = Router();
const w = wrap;
const farmerOnly = [authenticate, requireRole('farmer')];

router.get('/:id', authenticate, w(bookingController.getSlot));
router.post('/book', ...farmerOnly, validate(bookSlotSchema), w(bookingController.book));
router.post('/bookings/:id/cancel', ...farmerOnly, w(bookingController.cancel));
router.post('/bookings/:id/reschedule', ...farmerOnly, validate(rescheduleSchema), w(bookingController.reschedule));

export default router;