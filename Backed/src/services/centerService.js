import { centerRepo } from '../repositories/centerRepo.js';
import { slotRepo } from '../repositories/slotRepo.js';
import { queueService } from './queueService.js';
import { env } from '../config/env.js';
import { recommendCenters } from '../ml/recommendation.js';
import { predictWaitTimeML, recommendCentersML, mlEnabled } from '../ml/client.js';
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

function waitPayload(center, peopleAhead) {
  const now = new Date();
  return {
    center_id: center.id,
    queue_length: Math.max(0, peopleAhead),
    active_counters: center.active_counters || env.service.activeCounters,
    avg_processing_minutes: env.service.avgProcessMinutes,
    time_of_day: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    day_of_week: (now.getDay() + 6) % 7,
    commodity: null,
    is_peak_hour: null,
  };
}

async function estimateWaitFor(center, peopleAhead) {
  if (mlEnabled()) {
    const pred = await predictWaitTimeML(waitPayload(center, peopleAhead));
    if (pred) return Math.max(0, pred.predictedWaitMinutes);
  }
  const counters = Math.max(1, center.active_counters || env.service.activeCounters);
  if (peopleAhead <= 0) return 0;
  return Math.ceil((peopleAhead / counters) * env.service.avgProcessMinutes);
}

async function withQueueInfo(center) {
  const summary = queueService.getQueueSummary(center.id);
  const estimatedWaitMinutes = await estimateWaitFor(center, summary.active);
  return {
    ...center,
    distanceKm: null,
    currentToken: summary.currentTokenNumber,
    activeQueue: summary.active,
    estimatedWaitMinutes,
    doneToday: summary.completed,
  };
}

export const centerService = {
  async listCenters({ district = null, status = null, lat = null, lng = null, radiusKm = null } = {}) {
    let rows = centerRepo.list({ district, status });
    rows = await Promise.all(rows.map((c) => withQueueInfo(c)));
    if (lat != null && lng != null) {
      rows = rows.map((c) => ({
        ...c,
        distanceKm: haversineKm(lat, lng, c.latitude, c.longitude),
      }));
      if (radiusKm != null) rows = rows.filter((c) => c.distanceKm !== null && c.distanceKm <= radiusKm);
    }
    return rows;
  },

  async getCenter(id) {
    const center = centerRepo.findById(id);
    if (!center) return null;
    const summary = queueService.getQueueSummary(center.id);
    const estimatedWaitMinutes = await estimateWaitFor(center, summary.active);
    return { ...center, summary, estimatedWaitMinutes };
  },

  async recommend({ lat = null, lng = null, district = null } = {}) {
    const centers = await this.listCenters({ district, lat, lng });
    if (mlEnabled() && lat != null && lng != null) {
      const candidates = centers.map((c) => ({
        center_id: c.id,
        name: c.name,
        latitude: c.latitude || 0,
        longitude: c.longitude || 0,
        current_queue_length: c.activeQueue || 0,
        predicted_wait_minutes: c.estimatedWaitMinutes || 0,
        slot_available: true,
        is_open: c.status === 'active',
        distance_km: c.distanceKm ?? null,
      }));
      if (candidates.length > 0) {
        const result = await recommendCentersML({
          farmer_id: null,
          farmer_lat: lat,
          farmer_lng: lng,
          centers: candidates,
        });
        if (result) {
          const byId = new Map(centers.map((c) => [c.id, c]));
          return result.rankedCenters
            .map((r) => ({
              ...(byId.get(r.center_id) || {}),
              id: r.center_id,
              distanceKm: r.distance_km ?? null,
              estimatedWaitMinutes: r.predicted_wait_minutes,
              recommendationScore: r.score,
              recommendationRank: r.rank,
              modelVersion: result.modelVersion,
            }))
            .filter((c) => c.id != null);
        }
      }
    }
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
