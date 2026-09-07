import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { getDb } from '../config/db.js';
import { userRepo } from '../repositories/userRepo.js';
import { unauthorized, badRequest } from '../utils/errors.js';

function signAccess(user) {
  return jwt.sign(
    { id: user.id, mobile: user.mobile, name: user.name, role: user.role },
    env.jwt.secret,
    { expiresIn: env.jwt.accessExpires },
  );
}

function generateRefreshToken() {
  return crypto.randomBytes(48).toString('hex');
}

function storeRefreshToken(userId, token) {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  return getDb().prepare(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
  ).run(userId, token, expiresAt).lastInsertRowid;
}

export function issueTokens(user) {
  const refreshToken = generateRefreshToken();
  storeRefreshToken(user.id, refreshToken);
  return {
    accessToken: signAccess(user),
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: env.jwt.accessExpires,
  };
}

export function refreshAccessToken(refreshToken) {
  const db = getDb();
  const row = db.prepare(
    'SELECT * FROM refresh_tokens WHERE token = ? AND revoked_at IS NULL',
  ).get(refreshToken);
  if (!row) throw unauthorized('Invalid refresh token');
  if (new Date(row.expires_at) < new Date()) throw unauthorized('Refresh token has expired');
  const user = userRepo.findById(row.user_id);
  if (!user) throw unauthorized('User no longer exists');
  db.prepare('UPDATE refresh_tokens SET revoked_at = ? WHERE id = ?').run(new Date().toISOString(), row.id);
  return issueTokens(user);
}

export function revokeRefreshToken(refreshToken) {
  const db = getDb();
  const result = db.prepare('UPDATE refresh_tokens SET revoked_at = ? WHERE token = ? AND revoked_at IS NULL').run(
    new Date().toISOString(),
    refreshToken,
  );
  if (result.changes === 0) throw badRequest('INVALID_REFRESH_TOKEN', 'Refresh token is not valid or already revoked');
}

export function findOrCreateFarmer(mobile) {
  const existing = userRepo.findByMobile(mobile);
  if (existing) return existing;
  return userRepo.create({ name: `Farmer ${mobile.slice(-4)}`, mobile });
}

export function getFreshUser(user) {
  return userRepo.findById(user.id);
}