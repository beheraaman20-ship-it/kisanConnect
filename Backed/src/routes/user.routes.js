import { Router } from 'express';
import { userController } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { wrap } from '../utils/asyncHandler.js';

const router = Router();
const w = wrap;

router.post('/devices', authenticate, w(userController.registerDevice));
router.get('/notifications', authenticate, w(userController.listNotifications));
router.post('/notifications/:id/read', authenticate, w(userController.markRead));
router.post('/notifications/read-all', authenticate, w(userController.markAllRead));

export default router;