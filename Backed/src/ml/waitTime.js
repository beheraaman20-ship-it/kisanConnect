export function estimateWait({ peopleAhead, avgProcessMinutes = 10, activeCounters = 1 }) {
  const counters = Math.max(1, activeCounters);
  if (peopleAhead <= 0) return 0;
  return Math.ceil((peopleAhead / counters) * avgProcessMinutes);
}