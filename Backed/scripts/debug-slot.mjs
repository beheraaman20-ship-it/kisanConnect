import { getDb } from '../src/config/db.js';
const db = getDb();
console.log('=== FUTURE SLOTS ===');
console.table(db.prepare(
  "SELECT id, center_id, token_date, start_time, available_slots, status FROM slots WHERE token_date >= '2026-09-10' ORDER BY token_date, id LIMIT 15"
).all());