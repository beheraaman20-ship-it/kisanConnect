import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  centerCreateSchema,
  centerUpdateSchema,
  scheduleCreateSchema,
  slotUpdateSchema,
  staffAssignSchema,
} from '../validators/admin.js';
import { wrap } from '../utils/asyncHandler.js';

const router = Router();
const w = wrap;
const adminOnly = [authenticate, requireRole('admin')];

router.get('/dashboard', ...adminOnly, w(adminController.dashboard));
router.get('/statistics', ...adminOnly, w(adminController.statistics));
router.get('/farmers', ...adminOnly, w(adminController.farmers));
router.get('/staff', ...adminOnly, w(adminController.listStaff));
router.post('/staff/assign', ...adminOnly, validate(staffAssignSchema), w(adminController.assignStaff));
router.get('/audit-logs', ...adminOnly, w(adminController.auditLogs));

router.get('/centers', ...adminOnly, w(adminController.listCenters));
router.post('/centers', ...adminOnly, validate(centerCreateSchema), w(adminController.createCenter));
router.put('/centers/:id', ...adminOnly, validate(centerUpdateSchema), w(adminController.updateCenter));
router.delete('/centers/:id', ...adminOnly, w(adminController.deleteCenter));

router.get('/schedules', ...adminOnly, w(adminController.listSchedules));
router.post('/schedules', ...adminOnly, validate(scheduleCreateSchema), w(adminController.createSchedule));
router.put('/schedules/:id', ...adminOnly, validate(slotUpdateSchema), w(adminController.updateSchedule));

export default router;