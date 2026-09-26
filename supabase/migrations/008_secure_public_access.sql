-- Khoa doc cong khai tren bang, chuyen sang ham rieng chi tra dung du lieu can thiet
DROP POLICY IF EXISTS guests_self_read ON guests;
DROP POLICY IF EXISTS guests_public_read ON guests;
DROP POLICY IF EXISTS events_public_read ON events;
DROP POLICY IF EXISTS floors_public_read ON floors;
DROP POLICY IF EXISTS tables_public_read ON tables;

CREATE OR REPLACE FUNCTION get_invite(p_code text) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g guests; e events;
BEGIN
  SELECT * INTO g FROM guests WHERE code = upper(p_code) LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT * INTO e FROM events WHERE id = g.event_id AND published = true;
  IF NOT FOUND THEN RETURN NULL; END IF;
  RETURN json_build_object(
    'guest', json_build_object('id', g.id, 'name', g.name, 'code', g.code, 'table_id', g.table_id, 'companions', g.companions, 'confirmed', g.confirmed),
    'event', to_jsonb(e) - 'user_id',
    'floors', COALESCE((
      SELECT json_agg(json_build_object(
        'id', f.id, 'name', f.name, 'order_index', f.order_index,
        'tables', COALESCE((
          SELECT json_agg(json_build_object(
            'id', t.id, 'name', t.name, 'seats', t.seats, 'vip', t.vip,
            'used', (SELECT COALESCE(SUM(1 + x.companions), 0) FROM guests x WHERE x.table_id = t.id AND x.no_show = false AND x.id <> g.id)
          ) ORDER BY t.name) FROM tables t WHERE t.floor_id = f.id
        ), '[]'::json)
      ) ORDER BY f.order_index) FROM floors f WHERE f.event_id = e.id
    ), '[]'::json)
  );
END $$;

CREATE OR REPLACE FUNCTION confirm_seat(p_code text, p_table_id uuid, p_companions int) RETURNS json
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
  UPDATE guests SET table_id = t.id, companions = p_companions, confirmed = true WHERE id = g.id;
  RETURN json_build_object('success', true);
END $$;

CREATE OR REPLACE FUNCTION mark_viewed(p_code text) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE guests SET viewed = true WHERE code = upper(p_code);
$$;

CREATE OR REPLACE FUNCTION display_data(p_event_id uuid) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE e events;
BEGIN
  SELECT * INTO e FROM events WHERE id = p_event_id AND published = true;
  IF NOT FOUND THEN RETURN NULL; END IF;
  RETURN json_build_object(
    'event', to_jsonb(e) - 'user_id',
    'floors', COALESCE((
      SELECT json_agg(json_build_object(
        'id', f.id, 'name', f.name, 'order_index', f.order_index,
        'tables', COALESCE((SELECT json_agg(to_jsonb(t)) FROM tables t WHERE t.floor_id = f.id), '[]'::json)
      ) ORDER BY f.order_index) FROM floors f WHERE f.event_id = e.id
    ), '[]'::json),
    'guests', COALESCE((
      SELECT json_agg(json_build_object(
        'id', x.id, 'table_id', x.table_id, 'companions', x.companions, 'no_show', x.no_show, 'checked_in', x.checked_in,
        'name', CASE WHEN e.show_guest_names_on_map THEN x.name ELSE NULL END
      )) FROM guests x WHERE x.event_id = e.id
    ), '[]'::json)
  );
END $$;

GRANT EXECUTE ON FUNCTION get_invite(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION confirm_seat(text, uuid, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION mark_viewed(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION display_data(uuid) TO anon, authenticated;
