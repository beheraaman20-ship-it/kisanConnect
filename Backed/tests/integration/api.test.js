import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

process.env.NODE_ENV = 'test';
const testDbPath = path.join(os.tmpdir(), `kisanconnect-test-${Date.now()}-${Math.floor(Math.random() * 10000)}.db`);
process.env.DB_PATH = testDbPath;
process.env.JWT_SECRET = 'test-secret';
process.env.OTP_DEV_MODE = 'true';
process.env.OTP_RATE_LIMIT_MAX = '50';
process.env.OTP_RATE_LIMIT_WINDOW_MS = '60000';

const { getDb, closeDb } = await import('../../src/config/db.js');
const { seedIfEmpty } = await import('../../src/config/seed.js');
const { createApp } = await import('../../src/app.js');

const app = createApp();
const request = supertest(app);

describe('Smart Farmer Procurement API', () => {
  let db;
  let adminTokens;
  let staffTokens;
  let farmerTokens;
  let farmerId;
  let staffCenterId;

  before(() => {
    db = getDb();
    seedIfEmpty();
    const staffUser = db.prepare('SELECT id FROM users WHERE role = ?').get('staff');
    staffCenterId = db.prepare('SELECT center_id FROM staff_center_assignments WHERE user_id = ?').get(staffUser.id).center_id;
  });

  after(() => {
    closeDb();
    fs.rmSync(testDbPath, { force: true });
    fs.rmSync(testDbPath + '-wal', { force: true });
    fs.rmSync(testDbPath + '-shm', { force: true });
    setTimeout(() => process.exit(0), 100).unref();
  });

  describe('Health', () => {
    it('GET /health', async () => {
      const res = await request.get('/api/v1/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'ok');
    });
  });

  describe('Authentication', () => {
    it('send-otp for admin', async () => {
      const res = await request.post('/api/v1/auth/send-otp').send({ mobile: '9000000000' });
      assert.equal(res.status, 200);
      assert.ok(res.body.data.devOtp);
      assert.equal(typeof res.body.data.devOtp, 'string');
    });

    it('verify-otp for admin', async () => {
      const send = await request.post('/api/v1/auth/send-otp').send({ mobile: '9000000000' });
      const otp = send.body.data.devOtp;
      const res = await request.post('/api/v1/auth/verify-otp').send({ mobile: '9000000000', otp });
      assert.equal(res.status, 200);
      adminTokens = res.body.data;
      assert.ok(res.body.data.accessToken);
      assert.ok(res.body.data.refreshToken);
      assert.equal(res.body.data.user.role, 'admin');
    });

    it('verify-otp for staff', async () => {
      const send = await request.post('/api/v1/auth/send-otp').send({ mobile: '9000000001' });
      const res = await request.post('/api/v1/auth/verify-otp').send({ mobile: '9000000001', otp: send.body.data.devOtp });
      staffTokens = res.body.data;
      assert.equal(res.body.data.user.role, 'staff');
    });

    it('verify-otp for new farmer (auto-register)', async () => {
      const send = await request.post('/api/v1/auth/send-otp').send({ mobile: '9999988877' });
      const res = await request.post('/api/v1/auth/verify-otp').send({ mobile: '9999988877', otp: send.body.data.devOtp });
      farmerTokens = res.body.data;
      farmerId = farmerTokens.user.id;
      assert.equal(res.body.data.user.role, 'farmer');
    });

    it('rejects wrong otp', async () => {
      await request.post('/api/v1/auth/send-otp').send({ mobile: '9999988877' });
      const res = await request.post('/api/v1/auth/verify-otp').send({ mobile: '9999988877', otp: '0000' });
      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });

    it('GET /auth/me', async () => {
      const res = await request
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.data.user.role, 'admin');
    });
  });

  describe('Centers', () => {
    it('list centers', async () => {
      const res = await request.get('/api/v1/centers');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.data.centers));
      assert.ok(res.body.data.centers.length >= 3);
    });

    it('get center detail', async () => {
      const list = await request.get('/api/v1/centers');
      const id = list.body.data.centers[0].id;
      const res = await request.get(`/api/v1/centers/${id}`);
      assert.equal(res.status, 200);
      assert.ok(res.body.data.center);
      assert.ok(res.body.data.center.summary);
    });

    it('get center schedule', async () => {
      const list = await request.get('/api/v1/centers');
      const id = list.body.data.centers[0].id;
      const res = await request.get(`/api/v1/centers/${id}/schedule`);
      assert.equal(res.status, 200);
      assert.ok(res.body.data.dates.length > 0);
    });

    it('get center queue', async () => {
      const list = await request.get('/api/v1/centers');
      const id = list.body.data.centers[0].id;
      const res = await request.get(`/api/v1/centers/${id}/queue`);
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.data.tokens));
    });
  });

  describe('Slot Booking', () => {
    let slotId;

    it('lists slots for center', async () => {
      const list = await request.get('/api/v1/centers');
      const centerId = list.body.data.centers[0].id;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getUTCDate() + 1);
      const dateStr = tomorrow.toISOString().slice(0, 10);
      const res = await request.get(`/api/v1/centers/${centerId}/schedule?to=${dateStr}`);
      assert.equal(res.status, 200);
      const dates = Object.keys(res.body.data.slots);
      if (dates.length) {
        slotId = res.body.data.slots[dates[0]][0].id;
      }
    });

    it('books a slot', async () => {
      if (!slotId) {
        console.log('    [skip] no slot found to book');
        return;
      }
      const res = await request
        .post('/api/v1/slots/book')
        .set('Authorization', `Bearer ${farmerTokens.accessToken}`)
        .send({ slotId });
      assert.equal(res.status, 201);
      assert.ok(res.body.data.token);
      assert.ok(res.body.data.token.token_number);
      assert.equal(res.body.data.token.status, 'BOOKED');
    });

    it('rejects duplicate booking same day', async () => {
      if (!slotId) return;
      const res = await request
        .post('/api/v1/slots/book')
        .set('Authorization', `Bearer ${farmerTokens.accessToken}`)
        .send({ slotId });
      assert.equal(res.status, 409);
      assert.equal(res.body.error.code, 'ALREADY_BOOKED');
    });
  });

  describe('Tokens & Queue', () => {
    let tokenId;

    it('get token details', async () => {
      const bookings = await request
        .get('/api/v1/farmers/me/bookings')
        .set('Authorization', `Bearer ${farmerTokens.accessToken}`);
      tokenId = bookings.body.data.bookings[0]?.id;
      if (!tokenId) return;
      const res = await request
        .get(`/api/v1/tokens/${tokenId}`)
        .set('Authorization', `Bearer ${farmerTokens.accessToken}`);
      assert.equal(res.status, 200);
      assert.ok(res.body.data.token);
    });

    it('get token status', async () => {
      if (!tokenId) return;
      const res = await request
        .get(`/api/v1/tokens/${tokenId}/status`)
        .set('Authorization', `Bearer ${farmerTokens.accessToken}`);
      assert.equal(res.status, 200);
      assert.ok(res.body.data.token);
    });
  });

  describe('Center Operations', () => {
    it('staff gets today queue', async () => {
      const res = await request
        .get('/api/v1/center/queue/today')
        .set('Authorization', `Bearer ${staffTokens.accessToken}`);
      assert.equal(res.status, 200);
      assert.ok(res.body.data.summary);
      assert.ok(Array.isArray(res.body.data.tokens));
    });

    it('call next farmer', async () => {
      const res = await request
        .post('/api/v1/center/queue/next')
        .set('Authorization', `Bearer ${staffTokens.accessToken}`);
      assert.equal(res.status, 200);
      if (res.body.data.token) {
        assert.equal(res.body.data.token.status, 'VERIFICATION');
      }
    });
  });

  describe('Admin', () => {
    it('admin dashboard', async () => {
      const res = await request
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`);
      assert.equal(res.status, 200);
      assert.ok(res.body.data.users);
      assert.ok(res.body.data.centers);
    });

    it('admin statistics', async () => {
      const res = await request
        .get('/api/v1/admin/statistics')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`);
      assert.equal(res.status, 200);
      assert.ok(res.body.data.tokens);
    });

    it('admin farmers list', async () => {
      const res = await request
        .get('/api/v1/admin/farmers')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`);
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.data.farmers));
    });

    it('admin audit logs', async () => {
      const res = await request
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`);
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.data.logs));
    });
  });

  describe('Authorization', () => {
    it('blocks staff from admin routes', async () => {
      const res = await request
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${staffTokens.accessToken}`);
      assert.equal(res.status, 403);
    });

    it('blocks unauthenticated access', async () => {
      const res = await request.get('/api/v1/farmers/me');
      assert.equal(res.status, 401);
    });
  });

  describe('Error Handling', () => {
    it('returns 404 for unknown routes', async () => {
      const res = await request.get('/api/v1/nonexistent');
      assert.equal(res.status, 404);
    });
  });
});