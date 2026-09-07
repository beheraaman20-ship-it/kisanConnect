import { getDb } from '../config/db.js';
import logger from '../utils/logger.js';

let cleanupTimer = null;

export function startJobs() {
  if (cleanupTimer) return;
  logger.info('Starting background jobs');
  cleanupTimer = setInterval(() => {
    try {
      const result = getDb().prepare('DELETE FROM otp_codes WHERE expires_at < ?').run(new Date().toISOString());
      if (result.changes > 0) logger.info(`Cleaned up ${result.changes} expired OTP records`);
    } catch (err) {
      logger.error('OTP cleanup job failed', err);
    }
  }, 10 * 60 * 1000);
}

export function stopJobs() {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}