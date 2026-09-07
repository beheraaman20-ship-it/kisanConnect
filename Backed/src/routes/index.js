import { Router } from 'express';
import authRoutes from './auth.routes.js';
import farmerRoutes from './farmer.routes.js';
import centerRoutes from './center.routes.js';
import bookingRoutes from './booking.routes.js';
import tokenRoutes from './token.routes.js';
import centerOpsRoutes from './centerOps.routes.js';
import adminRoutes from './admin.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok', service: 'kisanconnect-backend' }));
router.use('/auth', authRoutes);
router.use('/farmers', farmerRoutes);
router.use('/centers', centerRoutes);
router.use('/slots', bookingRoutes);
router.use('/bookings', bookingRoutes);
router.use('/tokens', tokenRoutes);
router.use('/center', centerOpsRoutes);
router.use('/admin', adminRoutes);
router.use('/', userRoutes);

export default router;