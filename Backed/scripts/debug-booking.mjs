import { getDb } from '../src/config/db.js';
const db = getDb();
console.log('=== TOKENS ===');
console.table(db.prepare('SELECT id, token_number, token_date, farmer_id, slot_id, status FROM tokens ORDER BY id DESC LIMIT 15').all());
console.log('=== SLOTS (future dates) ===');
console.table(db.prepare('SELECT id, center_id, token_date, start_time, available_slots, status FROM slots WHERE token_date >= date("now") ORDER BY token_date, id LIMIT 20').all());