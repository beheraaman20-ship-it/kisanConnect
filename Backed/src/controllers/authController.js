import { sendOtp, verifyOtp, normalizeMobile, canRequestOtp } from '../services/otpService.js';
import {
  issueTokens,
  refreshAccessToken,
  revokeRefreshToken,
  findOrCreateFarmer,
  getFreshUser,
} from '../services/authService.js';
import { userRepo } from '../repositories/userRepo.js';
import { auditRepo } from '../repositories/auditRepo.js';
import { success } from '../utils/response.js';
import { tooManyRequests } from '../utils/errors.js';

export const authController = {
  async sendOtp(req, res) {
    const { mobile } = req.body;
    const normalized = normalizeMobile(mobile);
    if (!canRequestOtp(normalized)) throw tooManyRequests('Too many OTP requests for this mobile number. Please wait.');
    const result = await sendOtp(normalized);
    auditRepo.log({ userId: null, action: 'SEND_OTP', entityType: 'user', metadata: { mobile: normalized } });
    return success(res, result, 'OTP sent successfully');
  },

  async verifyOtp(req, res) {
    const { mobile, otp } = req.body;
    const normalized = await verifyOtp(mobile, otp);
    const user = findOrCreateFarmer(normalized);
    const tokens = issueTokens(user);
    auditRepo.log({ userId: user.id, action: 'LOGIN', entityType: 'user', entityId: user.id, metadata: { role: user.role } });
    return success(res, { user, ...tokens }, 'Login successful');
  },

  async refresh(req, res) {
    const tokens = refreshAccessToken(req.body.refreshToken);
    return success(res, tokens, 'Tokens refreshed');
  },

  async logout(req, res) {
    revokeRefreshToken(req.body.refreshToken);
    auditRepo.log({ userId: req.user?.id ?? null, action: 'LOGOUT' });
    return success(res, null, 'Logged out successfully');
  },

  async me(req, res) {
    const user = getFreshUser(req.user);
    return success(res, { user });
  },
};