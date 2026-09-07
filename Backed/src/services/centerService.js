import { centerRepo } from '../repositories/centerRepo.js';
import { slotRepo } from '../repositories/slotRepo.js';
import { queueService } from './queueService.js';
import { recommendCenters } from '../ml/recommendation.js';
import { todayStr, addDays } from '../utils/date.js';

function haversineKm(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function withQueueInfo(center) {
  const summary = queueService.getQueueSummary(center.id);
  return {
    ...center,
    distanceKm: null,
    currentToken: summary.currentTokenNumber,
    activeQueue: summary.active,
    estimatedWaitMinutes: summary.estimatedWaitMinutes,
    doneToday: summary.completed,
  };
}

export const centerService = {
  listCenters({ district = null, status = null, lat = null, lng = null, radiusKm = null } = {}) {
    let rows = centerRepo.list({ district, status });
    rows = rows.map((c) => withQueueInfo(c));
    if (lat != null && lng != null) {
      rows = rows.map((c) => ({
        ...c,
        distanceKm: haversineKm(lat, lng, c.latitude, c.longitude),
      }));
      if (radiusKm != null) rows = rows.filter((c) => c.distanceKm !== null && c.distanceKm <= radiusKm);
    }
    return rows;
  },

  getCenter(id) {
    const center = centerRepo.findById(id);
    if (!center) return null;
    const summary = queueService.getQueueSummary(center.id);
    return { ...center, summary };
  },

  async recommend({ lat = null, lng = null, district = null } = {}) {
    const centers = this.listCenters({ district, lat, lng });
    return recommendCenters(centers, { lat, lng });
  },

  schedule(centerId, { from = todayStr(), to = todayStr(addDays(6)) } = {}) {
    const center = centerRepo.findById(centerId);
    if (!center) return null;
    const slots = slotRepo.listByCenterRange(centerId, from, to).map((s) => ({
      ...s,
      booked: s.capacity - s.available_slots,
    }));
    const byDate = {};
    for (const slot of slots) {
      if (!byDate[slot.token_date]) byDate[slot.token_date] = [];
      byDate[slot.token_date].push(slot);
    }
    return { center, dates: Object.keys(byDate).sort(), slots: byDate };
  },
};