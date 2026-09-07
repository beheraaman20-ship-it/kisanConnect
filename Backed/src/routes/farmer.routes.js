import { Router } from 'express';
import { farmerController } from '../controllers/farmerController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { wrap } from '../utils/asyncHandler.js';

const router = Router();
const w = wrap;
const farmerOnly = [authenticate, requireRole('farmer')];

router.get('/me', ...farmerOnly, w(farmerController.getMe));
router.put('/me', ...farmerOnly, w(farmerController.updateMe));
router.get('/me/bookings', ...farmerOnly, w(farmerController.getBookings));
router.get('/me/procurements', ...farmerOnly, w(farmerController.getProcurements));

export default router;