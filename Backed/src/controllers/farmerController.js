import { userRepo } from '../repositories/userRepo.js';
import { tokenRepo } from '../repositories/tokenRepo.js';
import { procurementRepo } from '../repositories/procurementRepo.js';
import { parsePagination, paginateMeta } from '../utils/pagination.js';
import { success } from '../utils/response.js';

export const farmerController = {
  getMe(req, res) {
    const user = userRepo.findById(req.user.id);
    return success(res, { user });
  },

  updateMe(req, res) {
    const user = userRepo.update(req.user.id, req.body);
    return success(res, { user }, 'Profile updated');
  },

  getBookings(req, res) {
    const { page, perPage } = parsePagination(req.query);
    const { rows, total } = tokenRepo.listByFarmer(req.user.id, { page, perPage });
    return success(res, { bookings: rows, meta: paginateMeta(total, page, perPage) });
  },

  getProcurements(req, res) {
    const { page, perPage } = parsePagination(req.query);
    const { rows, total } = procurementRepo.listByFarmer(req.user.id, { page, perPage });
    return success(res, { procurements: rows, meta: paginateMeta(total, page, perPage) });
  },
};