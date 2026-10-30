-- Trả thêm bố cục tầng (khối sân khấu/lối đi/khu vực + ảnh nền) cho màn hình trình chiếu và thiệp mời.
-- Thay thế display_data (008) và get_invite (012). Chạy lại an toàn.
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
        'elements', COALESCE(f.elements, '[]'::jsonb),
        'background_url', COALESCE(f.background_url, ''),
        'background_opacity', COALESCE(f.background_opacity, 0.4),
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
    'guest', json_build_object('id', g.id, 'name', g.name, 'code', g.code, 'table_id', g.table_id, 'companions', g.companions, 'confirmed', g.confirmed),
    'event', to_jsonb(e) - 'user_id',
    'floors', COALESCE((
      SELECT json_agg(json_build_object(
        'id', f.id, 'name', f.name, 'order_index', f.order_index,
        'elements', COALESCE(f.elements, '[]'::jsonb),
        'background_url', COALESCE(f.background_url, ''),
        'background_opacity', COALESCE(f.background_opacity, 0.4),
        'tables', COALESCE((
          SELECT json_agg(json_build_object(
            'id', t.id, 'name', t.name, 'seats', t.seats, 'vip', t.vip, 'x_pct', t.x_pct, 'y_pct', t.y_pct,
            'used', (SELECT COALESCE(SUM(1 + x.companions), 0) FROM guests x WHERE x.table_id = t.id AND x.no_show = false AND x.id <> g.id)
          ) ORDER BY t.name) FROM tables t WHERE t.floor_id = f.id
        ), '[]'::json)
      ) ORDER BY f.order_index) FROM floors f WHERE f.event_id = e.id
    ), '[]'::json)
  );
END $$;

GRANT EXECUTE ON FUNCTION display_data(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_invite(text) TO anon, authenticated;
