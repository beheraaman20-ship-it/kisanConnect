import { env } from '../config/env.js';

const BASE = (env.service.mlServiceUrl || '').replace(/\/+$/, '');

export const mlEnabled = () => Boolean(BASE);

async function request(path, { method = 'POST', body, timeoutMs = 1500 } = {}) {
  if (!BASE) return null;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return res.json();
  } catch {
    clearTimeout(t);
    return null;
  }
}

export async function predictWaitTimeML(payload) {
  const data = await request('/api/v1/wait-time/predict', { body: payload });
  if (!data || data.predicted_wait_minutes === undefined) return null;
  return {
    predictedWaitMinutes: Number(data.predicted_wait_minutes),
    confidenceLow: data.confidence_low,
    confidenceHigh: data.confidence_high,
    baselineWaitMinutes: data.baseline_wait_minutes,
    modelVersion: data.model_version,
    predictedAt: data.predicted_at,
  };
}

export async function recommendCentersML(payload) {
  const data = await request('/api/v1/centers/recommend', { body: payload });
  if (!data || !Array.isArray(data.ranked_centers)) return null;
  return {
    rankedCenters: data.ranked_centers,
    modelVersion: data.model_version,
    predictedAt: data.predicted_at,
  };
}
