-- Checklist đám cưới tuỳ chỉnh: mỗi đám cưới một danh sách việc, tạo từ bộ mẫu theo vùng miền / các lễ / nơi đãi tiệc,
-- rồi người dùng thêm, sửa, xoá tuỳ ý. Lựa chọn lúc tạo lưu ở events.checklist_setup. Chạy lại an toàn.
ALTER TABLE events ADD COLUMN IF NOT EXISTS checklist_setup JSONB;

CREATE TABLE IF NOT EXISTS checklist_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  phase       TEXT NOT NULL DEFAULT 'm1',      -- m12 | m3 | m1 | w1 | d0 | after
  title       TEXT NOT NULL,
  note        TEXT NOT NULL DEFAULT '',
  owner       TEXT NOT NULL DEFAULT 'Cả hai',  -- Cả hai | Cô dâu | Chú rể | Nhà gái | Nhà trai
  ceremony    TEXT,                            -- danngo | anhoi | giatien | nhatho | chua | tiec
  auto_key    TEXT,                            -- việc WedTable tự đánh dấu (invite | send | seating | seats | day)
  done        BOOLEAN NOT NULL DEFAULT false,
  done_at     TIMESTAMPTZ,
  sort        INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_checklist_event ON checklist_items(event_id);

ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- chủ tiệc + người hỗ trợ vai trò thiết kế / sắp xếp (has_event_role luôn đúng với chủ tiệc)
DROP POLICY IF EXISTS "checklist_member_all" ON checklist_items;
CREATE POLICY "checklist_member_all" ON checklist_items
  FOR ALL USING (has_event_role(event_id, ARRAY['design', 'setup']))
  WITH CHECK (has_event_role(event_id, ARRAY['design', 'setup']));
