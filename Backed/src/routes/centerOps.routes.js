import { Router } from 'express';
import { centerOpsController } from '../controllers/centerOpsController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { staffScoped } from '../middleware/staffScoped.js';
import { validate } from '../middleware/validate.js';
import { advanceStatusSchema, procurementSchema } from '../validators/centerOps.js';
import { wrap } from '../utils/asyncHandler.js';

const router = Router();
const w = wrap;
const staffOnly = [authenticate, staffScoped, requireRole('staff', 'admin')];

router.get('/queue/today', ...staffOnly, w(centerOpsController.todayQueue));
router.post('/queue/next', ...staffOnly, w(centerOpsController.callNext));
router.post('/tokens/:id/arrived', ...staffOnly, w(centerOpsController.markArrived));
router.post('/tokens/:id/verify', ...staffOnly, w(centerOpsController.verify));
router.put('/tokens/:id/status', ...staffOnly, validate(advanceStatusSchema), w(centerOpsController.advanceStatus));
router.post('/tokens/:id/procurement', ...staffOnly, validate(procurementSchema), w(centerOpsController.recordProcurement));
router.post('/tokens/:id/complete', ...staffOnly, validate(procurementSchema), w(centerOpsController.completeProcurement));

export default router;