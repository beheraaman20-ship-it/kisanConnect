import { getDb, inTransaction } from './db.js';
import { todayStr, addDays, nowStr } from '../utils/date.js';
import logger from '../utils/logger.js';

const CENTERS = [
  { code: 'A', name: 'Ludhiana Mandi', location: 'Main Grain Market, Ludhiana', district: 'Ludhiana', latitude: 30.901, longitude: 75.8573 },
  { code: 'B', name: 'Patiala Mandi', location: 'Grain Market, Patiala', district: 'Patiala', latitude: 30.3398, longitude: 76.3869 },
  { code: 'C', name: 'Mullanpur Mandi', location: 'Mullanpur Mandi, Ludhiana', district: 'Ludhiana', latitude: 30.7882, longitude: 75.6714 },
];

const SLOT_TIMES = [
  ['09:00', '11:00'],
  ['11:00', '13:00'],
  ['13:00', '15:00'],
  ['15:00', '17:00'],
];

function insertUser(db, { name, mobile, role = 'farmer', district = null, village = null, address = null }) {
  return db.prepare(
    'INSERT INTO users (name, mobile, role, district, village, address) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(name, mobile, role, district, village, address).lastInsertRowid;
}

function insertCenter(db, c) {
  return db.prepare(
    'INSERT INTO procurement_centers (code, name, location, district, latitude, longitude, daily_capacity, active_counters) VALUES (?, ?, ?, ?, ?, ?, 150, 1)',
  ).run(c.code, c.name, c.location, c.district, c.latitude, c.longitude).lastInsertRowid;
}

function insertSlots(db, centerId, daysAhead) {
  const insert = db.prepare(
    'INSERT INTO slots (center_id, token_date, start_time, end_time, capacity, available_slots) VALUES (?, ?, ?, ?, 20, 20)',
  );
  let count = 0;
  for (let day = 0; day < daysAhead; day += 1) {
    const date = todayStr(addDays(day));
    for (const [start, end] of SLOT_TIMES) {
      insert.run(centerId, date, start, end);
      count += 1;
    }
  }
  return count;
}

export function seed() {
  inTransaction((db) => {
    const centerIds = {};
    for (const c of CENTERS) {
      const id = insertCenter(db, c);
      centerIds[c.code] = id;
      insertSlots(db, id, 4);
      db.prepare('INSERT OR IGNORE INTO token_sequences (center_id, token_date, last_seq) VALUES (?, ?, 0)').run(id, todayStr());
      logger.info(`Seeded center ${c.code}: ${c.name} (+ slots)`);
    }

    const adminId = insertUser(db, { name: 'System Admin', mobile: '9000000000', role: 'admin' });
    logger.info(`Seeded admin: 9000000000`);

    const staff = [
      { name: 'Center A Staff', mobile: '9000000001', centerCode: 'A' },
      { name: 'Center B Staff', mobile: '9000000002', centerCode: 'B' },
      { name: 'Center C Staff', mobile: '9000000003', centerCode: 'C' },
    ];
    for (const s of staff) {
      const id = insertUser(db, { name: s.name, mobile: s.mobile, role: 'staff' });
      db.prepare('INSERT INTO staff_center_assignments (user_id, center_id) VALUES (?, ?)').run(id, centerIds[s.centerCode]);
    }
    logger.info('Seeded 3 staff users');

    const farmers = [
      { name: 'Gurpreet Singh', mobile: '9012345670', district: 'Ludhiana', village: 'Rahon' },
      { name: 'Mohinder Kaur', mobile: '9012345671', district: 'Ludhiana', village: 'Doraha' },
      { name: 'Harjinder Singh', mobile: '9012345672', district: 'Patiala', village: 'Samana' },
      { name: 'Balwinder Singh', mobile: '9012345673', district: 'Ludhiana', village: 'Samrala' },
      { name: 'Kuldeep Singh', mobile: '9012345674', district: 'Patiala', village: 'Rajpura' },
      { name: 'Amandeep Kaur', mobile: '9012345675', district: 'Ludhiana', village: 'Jagraon' },
      { name: 'Sukhdev Singh', mobile: '9012345676', district: 'Ludhiana', village: 'Khanna' },
      { name: 'Jaswinder Kaur', mobile: '9012345677', district: 'Patiala', village: 'Nabha' },
      { name: 'Manpreet Singh', mobile: '9012345678', district: 'Ludhiana', village: 'Machhiwara' },
      { name: 'Ranjit Singh', mobile: '9012345679', district: 'Ludhiana', village: 'Payal' },
    ];
    const farmerIds = [];
    for (const f of farmers) {
      farmerIds.push(insertUser(db, f));
    }
    logger.info(`Seeded ${farmers.length} farmers`);
    seedDemoQueue(db, centerIds, farmerIds);
  });
}

function seedDemoQueue(db, centerIds, farmerIds) {
  const dates = ['2020-01-01'];
  void dates;
  const today = todayStr();
  const slotStmt = db.prepare('SELECT id FROM slots WHERE center_id = ? AND token_date = ? ORDER BY id LIMIT 5');
  const slotRows = slotStmt.all(centerIds['A'], today);
  if (slotRows.length === 0) return;

  const farmerPool = farmerIds.slice(0, 5);
  const insertToken = db.prepare(
    'INSERT INTO tokens (token_number, token_date, farmer_id, center_id, slot_id, status, queue_position, estimated_wait_minutes, booked_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );
  const seqStmt = db.prepare('UPDATE token_sequences SET last_seq = last_seq + 1 WHERE center_id = ? AND token_date = ?');
  const getSeq = db.prepare('SELECT last_seq FROM token_sequences WHERE center_id = ? AND token_date = ?');

  const statuses = ['BOOKED', 'BOOKED', 'WAITING', 'WAITING', 'VERIFICATION'];
  let position = 0;
  for (let i = 0; i < statuses.length; i += 1) {
    seqStmt.run(centerIds['A'], today);
    const seq = getSeq.get(centerIds['A'], today).last_seq;
    const tokenNumber = `A-${String(seq).padStart(3, '0')}`;
    position += 1;
    insertToken.run(
      tokenNumber,
      today,
      farmerPool[i % farmerPool.length],
      centerIds['A'],
      slotRows[i % slotRows.length].id,
      statuses[i],
      position,
      Math.max(0, position - 1) * 10,
      nowStr(),
    );
  }
  db.prepare('UPDATE slots SET available_slots = available_slots - 5 WHERE id = ?').run(slotRows[0].id);
  logger.info('Seeded 5 demo queue tokens for Center A today');
}

export function seedIfEmpty() {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) AS c FROM procurement_centers').get();
  if (Number(row.c) === 0) {
    seed();
    return true;
  }
  return false;
}