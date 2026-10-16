-- Bản get_invite đang chạy thật trên database (thay thế bản trong 008).
-- Khác bản cũ: trả {"error":"NOT_PUBLISHED"} khi sự kiện chưa publish, và có x_pct/y_pct của bàn.
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
