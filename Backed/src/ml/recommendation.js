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

export function recommendCenters(centers, { lat = null, lng = null, weights } = {}) {
  const w = {
    wait: 0.4,
    distance: 0.3,
    availability: 0.2,
    status: 0.1,
    ...weights,
  };

  return centers
    .map((c) => {
      const distanceKm = haversineKm(lat, lng, c.latitude, c.longitude);
      const predictedWait = c.estimatedWaitMinutes ?? 0;
      const openRatio = c.availableSlots > 0 ? 1 : 0;
      const statusScore = c.status === 'active' ? 1 : 0;

      const normWait = Math.max(0, 1 - predictedWait / 120);
      const normDistance = distanceKm == null ? 0 : Math.max(0, 1 - distanceKm / 50);

      const rawScore = w.wait * normWait + w.distance * normDistance + w.availability * openRatio + w.status * statusScore;
      return {
        ...c,
        distanceKm,
        recommendationScore: Number(rawScore.toFixed(4)),
      };
    })
    .sort((a, b) => b.recommendationScore - a.recommendationScore);
}