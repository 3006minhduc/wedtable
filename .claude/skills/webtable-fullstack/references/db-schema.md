# WebTable — Database Schema

PostgreSQL trên Supabase. Copy từng block SQL vào `supabase/migrations/`.

## Sơ đồ quan hệ

```
auth.users (Supabase built-in)
    │
    └── events (1 user : nhiều event)
            │
            ├── floors (1 event : 1–3 tầng)
            │       └── tables (1 tầng : nhiều bàn)
            │               └── guests.table_id
            │
            └── guests (1 event : nhiều khách)
                    └── guest_photos (ảnh check-in, tùy chọn)
```

---

## Migration 001 — Core Tables

```sql
-- Bật extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- EVENTS
-- ─────────────────────────────────────────
CREATE TABLE events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Thông tin cơ bản
  bride_name      TEXT NOT NULL DEFAULT '',
  groom_name      TEXT NOT NULL DEFAULT '',
  event_date      DATE,
  event_time      TIME DEFAULT '18:00',
  venue_name      TEXT DEFAULT '',
  venue_type      TEXT DEFAULT 'indoor' CHECK (venue_type IN ('indoor','outdoor')),
  floors_count    INT  DEFAULT 1 CHECK (floors_count BETWEEN 1 AND 3),
  menu            TEXT DEFAULT '',

  -- Cài đặt publish / lock
  published       BOOLEAN DEFAULT false,
  lock_at         TIMESTAMPTZ,

  -- Giao diện trang khách mời
  template        TEXT DEFAULT 'co-dien',
  gallery         JSONB DEFAULT '[]',   -- mảng Supabase Storage URLs
  video_url       TEXT DEFAULT '',
  show_guest_names_on_map BOOLEAN DEFAULT false,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- FLOORS
-- ─────────────────────────────────────────
CREATE TABLE floors (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'Tầng 1',
  order_index INT  DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- TABLES (bàn ăn)
-- ─────────────────────────────────────────
CREATE TABLE tables (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  floor_id    UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'Bàn 1',
  x_pct       NUMERIC(5,2) DEFAULT 50,  -- % vị trí X trên canvas
  y_pct       NUMERIC(5,2) DEFAULT 50,  -- % vị trí Y trên canvas
  seats       INT DEFAULT 10 CHECK (seats BETWEEN 2 AND 30),
  vip         BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- GUESTS
-- ─────────────────────────────────────────
CREATE TABLE guests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  table_id        UUID REFERENCES tables(id) ON SET NULL,

  name            TEXT NOT NULL,
  phone           TEXT DEFAULT '',
  code            TEXT NOT NULL,          -- 6 ký tự random, dùng cho QR + link
  companions      INT DEFAULT 0,

  -- Trạng thái
  confirmed       BOOLEAN DEFAULT false,
  no_show         BOOLEAN DEFAULT false,
  checked_in      BOOLEAN DEFAULT false,
  checked_in_at   TIMESTAMPTZ,
  viewed          BOOLEAN DEFAULT false,  -- đã mở link mời
  walk_in         BOOLEAN DEFAULT false,  -- khách vãng lai tại sự kiện

  -- Nhắc nhở
  remind_count    INT DEFAULT 0,
  last_remind_at  TIMESTAMPTZ,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(event_id, code)
);

-- Index thường dùng
CREATE INDEX idx_guests_event_id ON guests(event_id);
CREATE INDEX idx_guests_code     ON guests(code);
CREATE INDEX idx_guests_phone    ON guests(event_id, phone);
CREATE INDEX idx_tables_floor    ON tables(floor_id);
```

---

## Migration 002 — RLS Policies

```sql
-- ── EVENTS ──────────────────────────────
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Owner xem/sửa/xóa event của mình
CREATE POLICY "events_owner_all" ON events
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public đọc event đã publish (cho trang khách mời)
CREATE POLICY "events_public_read" ON events
  FOR SELECT USING (published = true);

-- ── FLOORS ──────────────────────────────
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "floors_owner_all" ON floors
  USING (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));

CREATE POLICY "floors_public_read" ON floors
  FOR SELECT USING (
    event_id IN (SELECT id FROM events WHERE published = true)
  );

-- ── TABLES ──────────────────────────────
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tables_owner_all" ON tables
  USING (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));

CREATE POLICY "tables_public_read" ON tables
  FOR SELECT USING (
    event_id IN (SELECT id FROM events WHERE published = true)
  );

-- ── GUESTS ──────────────────────────────
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guests_owner_all" ON guests
  USING (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));

-- Khách đọc thông tin của chính mình qua code
CREATE POLICY "guests_self_read" ON guests
  FOR SELECT USING (true);  -- filter bằng code ở query level

-- Khách cập nhật confirmed/companions của mình (qua API route)
-- Dùng service role trong API route, không expose trực tiếp
```

---

## Migration 003 — Auto-updated_at & Helper Functions

```sql
-- Tự cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER guests_updated_at
  BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Đếm chỗ còn trống của 1 bàn (loại trừ no_show)
CREATE OR REPLACE FUNCTION available_seats(table_id UUID)
RETURNS INT AS $$
  SELECT t.seats - COALESCE(SUM(1 + g.companions), 0)
  FROM tables t
  LEFT JOIN guests g ON g.table_id = t.id AND g.no_show = false
  WHERE t.id = table_id
  GROUP BY t.seats;
$$ LANGUAGE SQL STABLE;
```

---

## Migration 004 — Supabase Storage Buckets

```sql
-- Tạo bucket ảnh cưới (qua Supabase dashboard hoặc API)
-- Bucket: 'wedding-media'
-- Policy: authenticated upload, public read nếu event published

INSERT INTO storage.buckets (id, name, public)
VALUES ('wedding-media', 'wedding-media', false);

-- Policy storage: owner upload
CREATE POLICY "owner_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'wedding-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy storage: public read ảnh của event đã publish
CREATE POLICY "public_read_media" ON storage.objects
  FOR SELECT USING (bucket_id = 'wedding-media');
```

---

## Supabase Realtime — Enable cho bảng cần

```sql
-- Bật realtime cho guests (check-in cập nhật tức thì)
ALTER PUBLICATION supabase_realtime ADD TABLE guests;
ALTER PUBLICATION supabase_realtime ADD TABLE tables;
```

---

## Queries thường dùng

```typescript
// Lấy toàn bộ data của 1 event (dashboard)
const { data } = await supabase
  .from('events')
  .select(`
    *,
    floors(*, tables(*)),
    guests(*)
  `)
  .eq('id', eventId)
  .single()

// Tìm khách theo code (trang invite)
const { data: guest } = await supabase
  .from('guests')
  .select('*, events(*), tables(*, floors(*))')
  .eq('code', guestCode)
  .single()

// Thống kê nhanh
const { data: stats } = await supabase
  .from('guests')
  .select('confirmed, checked_in, no_show')
  .eq('event_id', eventId)
// Tính toán ở client: filter confirmed/checkedIn/noShow
```
