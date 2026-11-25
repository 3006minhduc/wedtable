-- 025: khách báo "không thể tham dự" ngay trên thiệp; xác nhận lại thì bỏ cờ vắng.
-- Chạy lại an toàn. Chạy TRƯỚC khi push code dùng decline_invite.

-- Khách từ chối: bỏ bàn, đánh dấu vắng (no_show), giữ lời nhắn.
CREATE OR REPLACE FUNCTION decline_invite(p_code text, p_note text DEFAULT NULL) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g guests; e events;
BEGIN
  SELECT * INTO g FROM guests WHERE code = upper(p_code) LIMIT 1;
  IF NOT FOUND THEN RETURN json_build_object('error', 'GUEST_NOT_FOUND', 'message', 'Không tìm thấy khách mời.'); END IF;
  SELECT * INTO e FROM events WHERE id = g.event_id AND published = true;
  IF NOT FOUND THEN RETURN json_build_object('error', 'GUEST_NOT_FOUND', 'message', 'Không tìm thấy khách mời.'); END IF;
  IF e.lock_at IS NOT NULL AND e.lock_at < now() THEN
    RETURN json_build_object('error', 'EVENT_LOCKED', 'message', 'Danh sách đã khóa, không thể thay đổi.');
  END IF;
  IF g.checked_in THEN
    RETURN json_build_object('error', 'CHECKED_IN', 'message', 'Bạn đã check-in tại tiệc rồi.');
  END IF;
  UPDATE guests SET table_id = NULL, companions = 0, confirmed = false, no_show = true,
    rsvp_note = COALESCE(left(p_note, 1000), rsvp_note)
  WHERE id = g.id;
  RETURN json_build_object('success', true);
END $$;
GRANT EXECUTE ON FUNCTION decline_invite(text, text) TO anon, authenticated;

-- Xác nhận tham dự: như 024, thêm bỏ cờ vắng (khách đổi ý sau khi đã từ chối).
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
    RETURN json_build_object('error', 'TABLE_FULL', 'message', 'Bàn này vừa hết chỗ. Bạn chọn bàn khác nhé.');
  END IF;
  UPDATE guests SET table_id = t.id, companions = p_companions, confirmed = true, no_show = false,
    dietary = COALESCE(left(p_dietary, 300), dietary),
    rsvp_note = COALESCE(left(p_note, 1000), rsvp_note),
    side = CASE WHEN p_side IN ('bride', 'groom') THEN p_side ELSE side END
  WHERE id = g.id;
  RETURN json_build_object('success', true);
END $$;
GRANT EXECUTE ON FUNCTION confirm_seat(text, uuid, int, text, text, text) TO anon, authenticated;

-- get_invite trả thêm no_show để thiệp biết khách đã báo không đến
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
      'dietary', g.dietary, 'rsvp_note', g.rsvp_note, 'side', g.side, 'no_show', g.no_show),
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
