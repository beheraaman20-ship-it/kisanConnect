-- Smart Farmer Procurement Management System
-- PostgreSQL production schema
-- Version 001

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  mobile TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('farmer', 'staff', 'admin')),
  address TEXT,
  district TEXT,
  village TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id BIGSERIAL PRIMARY KEY,
  mobile TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_otp_mobile ON otp_codes (mobile, created_at);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS procurement_centers (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  location TEXT,
  district TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  daily_capacity INTEGER NOT NULL DEFAULT 100,
  active_counters INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS slots (
  id BIGSERIAL PRIMARY KEY,
  center_id BIGINT NOT NULL REFERENCES procurement_centers(id) ON DELETE CASCADE,
  token_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INTEGER NOT NULL,
  available_slots INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'full')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (center_id, token_date, start_time)
);
CREATE INDEX IF NOT EXISTS idx_slots_center_date ON slots (center_id, token_date);

CREATE TABLE IF NOT EXISTS token_sequences (
  id BIGSERIAL PRIMARY KEY,
  center_id BIGINT NOT NULL REFERENCES procurement_centers(id) ON DELETE CASCADE,
  token_date DATE NOT NULL,
  last_seq INTEGER NOT NULL DEFAULT 0,
  UNIQUE (center_id, token_date)
);

CREATE TABLE IF NOT EXISTS tokens (
  id BIGSERIAL PRIMARY KEY,
  token_number TEXT NOT NULL,
  token_date DATE NOT NULL,
  farmer_id BIGINT NOT NULL REFERENCES users(id),
  center_id BIGINT NOT NULL REFERENCES procurement_centers(id),
  slot_id BIGINT NOT NULL REFERENCES slots(id),
  status TEXT NOT NULL DEFAULT 'BOOKED' CHECK (
    status IN ('BOOKED','WAITING','VERIFICATION','INSPECTION','PROCUREMENT','COMPLETED','CANCELLED','RESCHEDULED','REJECTED')
  ),
  queue_position INTEGER,
  estimated_wait_minutes INTEGER,
  booked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  called_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (center_id, token_date, token_number)
);
CREATE INDEX IF NOT EXISTS idx_tokens_center_date_status ON tokens (center_id, token_date, status);
CREATE INDEX IF NOT EXISTS idx_tokens_farmer_date ON tokens (farmer_id, token_date);
CREATE INDEX IF NOT EXISTS idx_tokens_slot ON tokens (slot_id);

CREATE TABLE IF NOT EXISTS procurement (
  id BIGSERIAL PRIMARY KEY,
  token_id BIGINT NOT NULL UNIQUE REFERENCES tokens(id) ON DELETE CASCADE,
  farmer_id BIGINT NOT NULL REFERENCES users(id),
  center_id BIGINT NOT NULL REFERENCES procurement_centers(id),
  commodity TEXT,
  quantity DOUBLE PRECISION,
  unit TEXT,
  quality_status TEXT CHECK (quality_status IN ('pending', 'good', 'average', 'rejected')),
  procurement_status TEXT NOT NULL DEFAULT 'IN_PROCESS' CHECK (procurement_status IN ('IN_PROCESS', 'COMPLETED', 'REJECTED')),
  payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_procurement_center ON procurement (center_id);
CREATE INDEX IF NOT EXISTS idx_procurement_farmer ON procurement (farmer_id);

CREATE TABLE IF NOT EXISTS status_history (
  id BIGSERIAL PRIMARY KEY,
  token_id BIGINT REFERENCES tokens(id) ON DELETE CASCADE,
  procurement_id BIGINT REFERENCES procurement(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT,
  changed_by BIGINT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_status_history_token ON status_history (token_id);
CREATE INDEX IF NOT EXISTS idx_status_history_proc ON status_history (procurement_id);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, read_at);

CREATE TABLE IF NOT EXISTS devices (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fcm_token TEXT NOT NULL UNIQUE,
  platform TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff_center_assignments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  center_id BIGINT NOT NULL REFERENCES procurement_centers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id BIGINT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);