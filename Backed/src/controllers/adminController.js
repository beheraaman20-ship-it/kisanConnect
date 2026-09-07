import { adminService } from '../services/adminService.js';
import { centerService } from '../services/centerService.js';
import { centerRepo } from '../repositories/centerRepo.js';
import { userRepo } from '../repositories/userRepo.js';
import { tokenRepo } from '../repositories/tokenRepo.js';
import { slotRepo } from '../repositories/slotRepo.js';
import { auditRepo } from '../repositories/auditRepo.js';
import { parsePagination, paginateMeta } from '../utils/pagination.js';
import { notFound } from '../utils/errors.js';
import { success, created } from '../utils/response.js';

export const adminController = {
  dashboard(req, res) {
    return success(res, adminService.dashboard());
  },

  statistics(req, res) {
    return success(res, adminService.statistics());
  },

  farmers(req, res) {
    const { page, perPage } = parsePagination(req.query);
    const result = userRepo.list({ role: req.query.role || null, search: req.query.search || null, page, perPage });
    return success(res, { farmers: result.rows, meta: paginateMeta(result.total, page, perPage) });
  },

  listCenters(req, res) {
    const centers = centerRepo.list({
      district: req.query.district || null,
      status: req.query.status || null,
    });
    return success(res, { centers });
  },

  createCenter(req, res) {
    const center = centerRepo.create(req.body);
    auditRepo.log({ userId: req.user.id, action: 'CREATE_CENTER', entityType: 'center', entityId: center.id });
    return created(res, { center }, 'Center created');
  },

  updateCenter(req, res) {
    const center = centerRepo.update(Number(req.params.id), req.body);
    if (!center) throw notFound('Center not found');
    auditRepo.log({ userId: req.user.id, action: 'UPDATE_CENTER', entityType: 'center', entityId: center.id });
    return success(res, { center }, 'Center updated');
  },

  deleteCenter(req, res) {
    const ok = centerRepo.delete(Number(req.params.id));
    if (!ok) throw notFound('Center not found');
    auditRepo.log({ userId: req.user.id, action: 'DELETE_CENTER', entityType: 'center', entityId: Number(req.params.id) });
    return success(res, null, 'Center deleted');
  },

  listSchedules(req, res) {
    const centerId = req.query.centerId ? Number(req.query.centerId) : null;
    const rows = centerId
      ? slotRepo.listByCenterRange(centerId, req.query.from, req.query.to)
      : [];
    return success(res, { schedules: rows });
  },

  createSchedule(req, res) {
    const centerId = req.body.centerId ?? req.body.center_id;
    const tokenDate = req.body.tokenDate ?? req.body.date;
    const result = adminService.createSlots(Number(centerId), {
      tokenDate,
      times: req.body.times,
      capacity: req.body.capacity,
      start_time: req.body.start_time,
      end_time: req.body.end_time,
    });
    auditRepo.log({ userId: req.user.id, action: 'CREATE_SCHEDULE', entityType: 'center', entityId: Number(centerId), metadata: { tokenDate } });
    return created(res, result, 'Schedule created');
  },

  updateSchedule(req, res) {
    const slot = adminService.updateSlot(Number(req.params.id), req.body);
    auditRepo.log({ userId: req.user.id, action: 'UPDATE_SCHEDULE', entityType: 'slot', entityId: Number(req.params.id) });
    return success(res, { slot }, 'Schedule updated');
  },

  listStaff(req, res) {
    const { page, perPage } = parsePagination(req.query);
    const result = userRepo.list({ role: 'staff', search: req.query.search || null, page, perPage });
    return success(res, { staff: result.rows, meta: paginateMeta(result.total, page, perPage) });
  },

  assignStaff(req, res) {
    const userId = req.body.userId ?? req.body.user_id;
    const centerId = req.body.centerId ?? req.body.center_id;
    const result = adminService.assignStaff(Number(userId), Number(centerId));
    auditRepo.log({ userId: req.user.id, action: 'ASSIGN_STAFF', entityType: 'user', entityId: Number(userId), metadata: { centerId: Number(centerId) } });
    return success(res, result, 'Staff assigned to center');
  },

  auditLogs(req, res) {
    const { page, perPage } = parsePagination(req.query);
    const { rows, total } = auditRepo.list({ page, perPage });
    return success(res, { logs: rows, meta: paginateMeta(total, page, perPage) });
  },
};