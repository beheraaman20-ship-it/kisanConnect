export function todayStr(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function nowStr() {
  return new Date().toISOString();
}

export function addDays(days, from = new Date()) {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function isoToDateStr(iso) {
  return iso ? iso.slice(0, 10) : null;
}