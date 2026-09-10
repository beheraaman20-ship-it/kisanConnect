import { centerService } from '../services/centerService.js';
import { notFound } from '../utils/errors.js';
import { success } from '../utils/response.js';
import { todayStr } from '../utils/date.js';

export const centerController = {
  async list(req, res) {
    const { district, status, lat, lng, radiusKm } = req.query;
    const centers = await centerService.listCenters({
      district: district || null,
      status: status || null,
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,
      radiusKm: radiusKm ? Number(radiusKm) : null,
    });
    return success(res, { centers });
  },

  async get(req, res) {
    const center = await centerService.getCenter(Number(req.params.id));
    if (!center) throw notFound('Center not found');
    return success(res, { center });
  },

  schedule(req, res) {
    const { from, to } = req.query;
    const data = centerService.schedule(Number(req.params.id), {
      from: from || todayStr(),
      to: to || undefined,
    });
    if (!data) throw notFound('Center not found');
    return success(res, data);
  },

  async recommendations(req, res) {
    const { lat, lng, district } = req.query;
    const centers = await centerService.recommend({
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,
      district: district || null,
    });
    return success(res, { centers });
  },
};