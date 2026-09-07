import bcrypt from 'bcryptjs';
import { getDb } from '../config/db.js';
import { env } from '../config/env.js';
import { badRequest } from '../utils/errors.js';

function generateOtp(digits) {
  const max = 10 ** digits;
  const value = Math.floor(Math.random() * max);
  return String(value).padStart(digits, '0');
}

export function normalizeMobile(mobile) {
  return String(mobile).replace(/[^\d]/g, '');
}

async function hashOtp(code) {
  return bcrypt.hash(code, 10);
}

export async function sendOtp(mobile) {
  const normalized = normalizeMobile(mobile);
  if (normalized.length < 10) {
    throw badRequest('INVALID_MOBILE', 'A valid 10-digit mobile number is required');
  }

  const code = generateOtp(env.otp.digits);
  const expiresAt = new Date(Date.now() + env.otp.ttlMinutes * 60 * 1000).toISOString();

  getDb().prepare(
    'INSERT INTO otp_codes (mobile, code_hash, expires_at) VALUES (?, ?, ?)',
  ).run(normalized, await hashOtp(code), expiresAt);

  const result = { success: true, message: 'OTP sent successfully' };
  if (env.otp.devMode) result.devOtp = code;
  return result;
}

export function canRequestOtp(mobile, now = new Date()) {
  const row = getDb().prepare(
    'SELECT COUNT(*) AS c FROM otp_codes WHERE mobile = ? AND created_at > ?',
  ).get(mobile, new Date(now.getTime() - env.otp.rateLimitWindowMs).toISOString());
  return Number(row.c) < env.otp.rateLimitMax;
}

export async function verifyOtp(mobile, code) {
  const normalized = normalizeMobile(mobile);
  const db = getDb();
  const row = db.prepare(
    'SELECT id, code_hash, expires_at, attempts FROM otp_codes WHERE mobile = ? ORDER BY id DESC LIMIT 1',
  ).get(normalized);

  if (!row) throw badRequest('OTP_NOT_FOUND', 'No OTP was requested for this mobile number');

  if (new Date(row.expires_at) < new Date()) {
    throw badRequest('OTP_EXPIRED', 'The OTP has expired. Please request a new one.');
  }

  if (Number(row.attempts) >= env.otp.maxAttempts) {
    db.prepare('DELETE FROM otp_codes WHERE id = ?').run(row.id);
    throw badRequest('OTP_MAX_ATTEMPTS', 'Too many incorrect attempts. Please request a new OTP.');
  }

  const matches = await bcrypt.compare(String(code), row.code_hash);
  if (!matches) {
    db.prepare('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?').run(row.id);
    throw badRequest('OTP_INVALID', 'The OTP is incorrect');
  }

  db.prepare('DELETE FROM otp_codes WHERE id = ?').run(row.id);
  return normalized;
}