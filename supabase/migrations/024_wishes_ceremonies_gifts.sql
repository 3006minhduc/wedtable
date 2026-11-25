-- 024: sổ lời chúc, các lễ tách riêng, mừng cưới hai bên, khách của nhà trai/nhà gái, chuyện tình theo mốc.
-- Chạy lại an toàn. Chạy TRƯỚC khi push code dùng các cột này.

-- Các lễ: [{ "name": "Lễ vu quy", "date": "2026-12-12", "time": "08:00", "place": "Tư gia nhà gái", "address": "..." }]
ALTER TABLE events ADD COLUMN IF NOT EXISTS ceremonies JSONB NOT NULL DEFAULT '[]'::jsonb;
-- Mừng cưới: [{ "side": "groom" | "bride", "bank": "Vietcombank", "number": "0123...", "holder": "TRAN DUC MINH", "qr": "https://..." }]
ALTER TABLE events ADD COLUMN IF NOT EXISTS gift_accounts JSONB NOT NULL DEFAULT '[]'::jsonb;
-- Chuyện tình theo mốc: [{ "year": "2019", "title": "Lần đầu gặp", "text": "..." }]
ALTER TABLE events ADD COLUMN IF NOT EXISTS story_milestones JSONB NOT NULL DEFAULT '[]'::jsonb;
-- Khách tự chọn khi xác nhận: 'bride' | 'groom' | ''
ALTER TABLE guests ADD COLUMN IF NOT EXISTS side TEXT NOT NULL DEFAULT '';

-- ---------- sổ lời chúc ----------
CREATE TABLE IF NOT EXISTS wishes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_id    UUID REFERENCES guests(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  message     TEXT NOT NULL,
  hidden      BOOLEAN NOT NULL DEFAULT false,
  pinned      BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wishes_event ON wishes(event_id, created_at DESC);
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
-- chủ tiệc + vai trò thiết kế xem, ẩn, ghim, xoá
DROP POLICY IF EXISTS "wishes_member_all" ON wishes;
CREATE POLICY "wishes_member_all" ON wishes
  FOR ALL USING (has_event_role(event_id, ARRAY['design']))
  WITH CHECK (has_event_role(event_id, ARRAY['design']));

-- Khách gửi lời chúc qua mã thiệp (tối đa 5 lời chúc mỗi khách, 500 ký tự)
CREATE OR REPLACE FUNCTION add_wish(p_code text, p_message text, p_name text DEFAULT NULL) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g guests; e events; n int; msg text;
BEGIN
  SELECT * INTO g FROM guests WHERE code = upper(p_code) LIMIT 1;
  IF NOT FOUND THEN RETURN json_build_object('error', 'GUEST_NOT_FOUND', 'message', 'Không tìm thấy khách mời.'); END IF;
  SELECT * INTO e FROM events WHERE id = g.event_id AND published = true;
  IF NOT FOUND THEN RETURN json_build_object('error', 'GUEST_NOT_FOUND', 'message', 'Không tìm thấy khách mời.'); END IF;
  msg := btrim(coalesce(p_message, ''));
  IF length(msg) < 2 THEN RETURN json_build_object('error', 'EMPTY', 'message', 'Bạn viết vài chữ chúc phúc nhé.'); END IF;
  SELECT count(*) INTO n FROM wishes WHERE guest_id = g.id;
  IF n >= 5 THEN RETURN json_build_object('error', 'LIMIT', 'message', 'Bạn đã gửi đủ 5 lời chúc rồi. Cảm ơn bạn!'); END IF;
  INSERT INTO wishes (event_id, guest_id, name, message)
  VALUES (g.event_id, g.id, left(coalesce(nullif(btrim(p_name), ''), g.name), 80), left(msg, 500));
  RETURN json_build_object('success', true);
END $$;
GRANT EXECUTE ON FUNCTION add_wish(text, text, text) TO anon, authenticated;

-- Khách đọc các lời chúc đang hiện của đám cưới (ghim lên đầu, mới nhất trước)
CREATE OR REPLACE FUNCTION get_wishes(p_code text) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g guests;
BEGIN
  SELECT * INTO g FROM guests WHERE code = upper(p_code) LIMIT 1;
  IF NOT FOUND THEN RETURN '[]'::json; END IF;
  RETURN COALESCE((
    SELECT json_agg(json_build_object('id', w.id, 'name', w.name, 'message', w.message, 'pinned', w.pinned, 'created_at', w.created_at, 'mine', w.guest_id = g.id)
      ORDER BY w.pinned DESC, w.created_at DESC)
    FROM (SELECT * FROM wishes WHERE event_id = g.event_id AND hidden = false ORDER BY pinned DESC, created_at DESC LIMIT 200) w
  ), '[]'::json);
END $$;
GRANT EXECUTE ON FUNCTION get_wishes(text) TO anon, authenticated;

-- ---------- xác nhận tham dự: thêm "khách của nhà trai / nhà gái" ----------
DROP FUNCTION IF EXISTS confirm_seat(text, uuid, int, text, text);
CREATE OR REPLACE FUNCTION confirm_seat(p_code text, p_table_id uuid, p_companions int, p_dietary text DEFAULT NULL, p_note text DEFAULT NULL, p_side text DEFAULT NULL) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g guests; e events; t tables; used int;
BEGIN
  SELECT * INTO g FROM guests WHERE code = upper(p_code) LIMIT 1;
  IF NOT FOUND THEN RETURN json_build_object('error', 'GUEST_NOT_FOUND', 'message', 'Không tìm thấy khách mời.'); END IF;
  SELECT * INTO e FROM events WHERE id = g.event_id AND published = true;
  IF NOT FOUND THEN RETURN json_build_object('error', 'GUEST_NOT_FOUND', 'message', 'Không tìm thấy khách mời.'); END IF;
  IF e.lock_at IS NOT NULL AND e.lock_at < now() THEN
    RETURN json_build_object('error', 'EVENT_LOCKED', 'message', 'Danh sách đã khóa, không thể thay đổi.');
  END IF;
  IF p_companions < 0 OR p_companions > 20 THEN
    RETURN json_build_object('error', 'INVALID', 'message', 'Số người đi kèm không hợp lệ.');
  END IF;
  SELECT * INTO t FROM tables WHERE id = p_table_id AND event_id = g.event_id;
  IF NOT FOUND THEN RETURN json_build_object('error', 'TABLE_NOT_FOUND', 'message', 'Không tìm thấy bàn.'); END IF;
  SELECT COALESCE(SUM(1 + companions), 0) INTO used FROM guests WHERE table_id = t.id AND no_show = false AND id <> g.id;
  IF t.seats - used < 1 + p_companions THEN
    RETURN json_build_object('error', 'TABLE_FULL', 'message', 'Bàn này đã đủ chỗ.');
  END IF;
  UPDATE guests SET table_id = t.id, companions = p_companions, confirmed = true,
    dietary = COALESCE(left(p_dietary, 300), dietary),
    rsvp_note = COALESCE(left(p_note, 1000), rsvp_note),
    side = CASE WHEN p_side IN ('bride', 'groom') THEN p_side ELSE side END
  WHERE id = g.id;
  RETURN json_build_object('success', true);
END $$;
GRANT EXECUTE ON FUNCTION confirm_seat(text, uuid, int, text, text, text) TO anon, authenticated;

-- get_invite trả thêm side của khách (các cột events mới tự có nhờ to_jsonb(e))
CREATE OR REPLACE FUNCTION get_invite(p_code text) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g guests; e events;
BEGIN
  SELECT * INTO g FROM guests WHERE code = upper(p_code) LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT * INTO e FROM events WHERE id = g.event_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF NOT COALESCE(e.published, false) THEN RETURN json_build_object('error', 'NOT_PUBLISHED'); END IF;
  RETURN json_build_object(
    'guest', json_build_object('id', g.id, 'name', g.name, 'code', g.code, 'table_id', g.table_id, 'companions', g.companions, 'confirmed', g.confirmed,
      'dietary', g.dietary, 'rsvp_note', g.rsvp_note, 'side', g.side),
    'event', to_jsonb(e) - 'user_id',
    'floors', COALESCE((
      SELECT json_agg(json_build_object(
        'id', f.id, 'name', f.name, 'order_index', f.order_index,
        'elements', COALESCE(f.elements, '[]'::jsonb),
        'background_url', COALESCE(f.background_url, ''),
        'background_opacity', COALESCE(f.background_opacity, 0.4),
        'hall_w', f.hall_w, 'hall_h', f.hall_h,
        'tables', COALESCE((
          SELECT json_agg(json_build_object(
            'id', t.id, 'name', t.name, 'seats', t.seats, 'vip', t.vip, 'x_pct', t.x_pct, 'y_pct', t.y_pct, 'shape', t.shape,
            'used', (SELECT COALESCE(SUM(1 + x.companions), 0) FROM guests x WHERE x.table_id = t.id AND x.no_show = false AND x.id <> g.id)
          ) ORDER BY t.name) FROM tables t WHERE t.floor_id = f.id
        ), '[]'::json)
      ) ORDER BY f.order_index) FROM floors f WHERE f.event_id = e.id
    ), '[]'::json)
  );
END $$;
GRANT EXECUTE ON FUNCTION get_invite(text) TO anon, authenticated;
