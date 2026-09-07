import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  mobile TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('farmer','staff','admin')),
  address TEXT,
  district TEXT,
  village TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mobile TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_otp_mobile ON otp_codes(mobile, created_at);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS procurement_centers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  location TEXT,
  district TEXT,
  latitude REAL,
  longitude REAL,
  daily_capacity INTEGER NOT NULL DEFAULT 100,
  active_counters INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','maintenance')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  center_id INTEGER NOT NULL REFERENCES procurement_centers(id) ON DELETE CASCADE,
  token_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  available_slots INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','full')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (center_id, token_date, start_time)
);
CREATE INDEX IF NOT EXISTS idx_slots_center_date ON slots(center_id, token_date);

CREATE TABLE IF NOT EXISTS token_sequences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  center_id INTEGER NOT NULL REFERENCES procurement_centers(id) ON DELETE CASCADE,
  token_date TEXT NOT NULL,
  last_seq INTEGER NOT NULL DEFAULT 0,
  UNIQUE (center_id, token_date)
);

CREATE TABLE IF NOT EXISTS tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_number TEXT NOT NULL,
  token_date TEXT NOT NULL,
  farmer_id INTEGER NOT NULL REFERENCES users(id),
  center_id INTEGER NOT NULL REFERENCES procurement_centers(id),
  slot_id INTEGER NOT NULL REFERENCES slots(id),
  status TEXT NOT NULL DEFAULT 'BOOKED'
    CHECK (status IN ('BOOKED','WAITING','VERIFICATION','INSPECTION','PROCUREMENT','COMPLETED','CANCELLED','RESCHEDULED','REJECTED')),
  queue_position INTEGER,
  estimated_wait_minutes INTEGER,
  booked_at TEXT NOT NULL DEFAULT (datetime('now')),
  called_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (center_id, token_date, token_number)
);
CREATE INDEX IF NOT EXISTS idx_tokens_center_date_status ON tokens(center_id, token_date, status);
CREATE INDEX IF NOT EXISTS idx_tokens_farmer_date ON tokens(farmer_id, token_date);
CREATE INDEX IF NOT EXISTS idx_tokens_slot ON tokens(slot_id);

CREATE TABLE IF NOT EXISTS procurement (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_id INTEGER NOT NULL UNIQUE REFERENCES tokens(id) ON DELETE CASCADE,
  farmer_id INTEGER NOT NULL REFERENCES users(id),
  center_id INTEGER NOT NULL REFERENCES procurement_centers(id),
  commodity TEXT,
  quantity REAL,
  unit TEXT,
  quality_status TEXT CHECK (quality_status IN ('pending','good','average','rejected')),
  procurement_status TEXT NOT NULL DEFAULT 'IN_PROCESS'
    CHECK (procurement_status IN ('IN_PROCESS','COMPLETED','REJECTED')),
  payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING','PAID')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_procurement_center ON procurement(center_id);
CREATE INDEX IF NOT EXISTS idx_procurement_farmer ON procurement(farmer_id);

CREATE TABLE IF NOT EXISTS status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_id INTEGER REFERENCES tokens(id) ON DELETE CASCADE,
  procurement_id INTEGER REFERENCES procurement(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT,
  changed_by INTEGER,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_status_history_token ON status_history(token_id);
CREATE INDEX IF NOT EXISTS idx_status_history_proc ON status_history(procurement_id);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data TEXT,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at);

CREATE TABLE IF NOT EXISTS devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fcm_token TEXT NOT NULL UNIQUE,
  platform TEXT,
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS staff_center_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  center_id INTEGER NOT NULL REFERENCES procurement_centers(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id INTEGER,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

function ensureDbDir(dbPath) {
  const dir = path.dirname(path.resolve(dbPath));
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

let db;

export function getDb() {
  if (db) return db;
  if (env.db.driver === 'postgres') {
    throw new Error('PostgreSQL driver requires the DATABASE_URL connection (not yet wired for local dev). Remove DB_DRIVER=postgres to use SQLite locally.');
  }
  const dbPath = env.db.path;
  ensureDbDir(dbPath);
  db = new DatabaseSync(dbPath);
  db.exec(SCHEMA);
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

export function inTransaction(fn) {
  const connection = getDb();
  connection.exec('BEGIN IMMEDIATE');
  try {
    const result = fn(connection);
    connection.exec('COMMIT');
    return result;
  } catch (err) {
    connection.exec('ROLLBACK');
    throw err;
  }
}