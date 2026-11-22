-- 023: nhạc nền thiệp, câu hỏi thường gặp (FAQ), khách ghi dị ứng thức ăn + lời nhắn khi xác nhận.
-- Chạy lại an toàn. Chạy TRƯỚC khi push code dùng các cột này.

ALTER TABLE events ADD COLUMN IF NOT EXISTS music_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS faq JSONB NOT NULL DEFAULT '[]'::jsonb; -- [{ "q": "...", "a": "..." }]
ALTER TABLE guests ADD COLUMN IF NOT EXISTS dietary TEXT NOT NULL DEFAULT '';
ALTER TABLE guests ADD COLUMN IF NOT EXISTS rsvp_note TEXT NOT NULL DEFAULT '';

-- confirm_seat nhận thêm dị ứng + lời nhắn (có giá trị mặc định nên code cũ gọi 3 tham số vẫn chạy)
DROP FUNCTION IF EXISTS confirm_seat(text, uuid, int);
CREATE OR REPLACE FUNCTION confirm_seat(p_code text, p_table_id uuid, p_companions int, p_dietary text DEFAULT NULL, p_note text DEFAULT NULL) RETURNS json
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
    rsvp_note = COALESCE(left(p_note, 1000), rsvp_note)
  WHERE id = g.id;
  RETURN json_build_object('success', true);
END $$;
GRANT EXECUTE ON FUNCTION confirm_seat(text, uuid, int, text, text) TO anon, authenticated;

-- get_invite trả thêm dietary, rsvp_note của chính khách đang xem (để điền sẵn khi sửa lại)
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
      'dietary', g.dietary, 'rsvp_note', g.rsvp_note),
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
