import { Router } from 'express';
import { centerController } from '../controllers/centerController.js';
import { queueController } from '../controllers/userController.js';
import { wrap } from '../utils/asyncHandler.js';

const router = Router();
const w = wrap;

router.get('/', w(centerController.list));
router.get('/recommendations', w(centerController.recommendations));
router.get('/:id', w(centerController.get));
router.get('/:id/schedule', w(centerController.schedule));
router.get('/:id/queue', w(queueController.get));
router.get('/:id/queue/summary', w(queueController.summary));

export default router;