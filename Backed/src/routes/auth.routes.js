import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { sendOtpSchema, verifyOtpSchema, refreshSchema } from '../validators/auth.js';
import { env } from '../config/env.js';
import { wrap } from '../utils/asyncHandler.js';

const router = Router();
const w = wrap;

const otpRateLimit = rateLimit({
  windowMs: env.otp.rateLimitWindowMs,
  max: env.otp.rateLimitMax,
  keyPrefix: 'otp-ip',
});

router.post('/send-otp', otpRateLimit, validate(sendOtpSchema), w(authController.sendOtp));
router.post('/verify-otp', validate(verifyOtpSchema), w(authController.verifyOtp));
router.post('/refresh', validate(refreshSchema), w(authController.refresh));
router.post('/logout', authenticate, validate(refreshSchema), w(authController.logout));
router.get('/me', authenticate, w(authController.me));

export default router;