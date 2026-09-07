import { Router } from 'express';
import { tokenController } from '../controllers/tokenController.js';
import { authenticate } from '../middleware/auth.js';
import { wrap } from '../utils/asyncHandler.js';

const router = Router();
const w = wrap;

router.get('/:id', authenticate, w(tokenController.get));
router.get('/:id/status', authenticate, w(tokenController.status));

export default router;