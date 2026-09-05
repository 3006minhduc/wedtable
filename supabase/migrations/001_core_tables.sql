-- Bat extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- EVENTS
CREATE TABLE events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  bride_name      TEXT NOT NULL DEFAULT '',
  groom_name      TEXT NOT NULL DEFAULT '',
  event_date      DATE,
  event_time      TIME DEFAULT '18:00',
  venue_name      TEXT DEFAULT '',
  venue_type      TEXT DEFAULT 'indoor' CHECK (venue_type IN ('indoor','outdoor')),
  floors_count    INT  DEFAULT 1 CHECK (floors_count BETWEEN 1 AND 3),
  menu            TEXT DEFAULT '',

  published       BOOLEAN DEFAULT false,
  lock_at         TIMESTAMPTZ,

  template        TEXT DEFAULT 'co-dien',
  gallery         JSONB DEFAULT '[]',
  video_url       TEXT DEFAULT '',
  show_guest_names_on_map BOOLEAN DEFAULT false,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- FLOORS
CREATE TABLE floors (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'Tang 1',
  order_index INT  DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- TABLES
CREATE TABLE tables (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  floor_id    UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'Ban 1',
  x_pct       NUMERIC(5,2) DEFAULT 50,
  y_pct       NUMERIC(5,2) DEFAULT 50,
  seats       INT DEFAULT 10 CHECK (seats BETWEEN 2 AND 30),
  vip         BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- GUESTS
CREATE TABLE guests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  table_id        UUID REFERENCES tables(id) ON DELETE SET NULL,

  name            TEXT NOT NULL,
  phone           TEXT DEFAULT '',
  code            TEXT NOT NULL,
  companions      INT DEFAULT 0,

  confirmed       BOOLEAN DEFAULT false,
  no_show         BOOLEAN DEFAULT false,
  checked_in      BOOLEAN DEFAULT false,
  checked_in_at   TIMESTAMPTZ,
  viewed          BOOLEAN DEFAULT false,
  walk_in         BOOLEAN DEFAULT false,

  remind_count    INT DEFAULT 0,
  last_remind_at  TIMESTAMPTZ,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(event_id, code)
);

CREATE INDEX idx_guests_event_id ON guests(event_id);
CREATE INDEX idx_guests_code     ON guests(code);
CREATE INDEX idx_guests_phone    ON guests(event_id, phone);
CREATE INDEX idx_tables_floor    ON tables(floor_id);
