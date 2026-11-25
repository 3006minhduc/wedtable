-- 026: bàn VIP dành riêng, khách tự chọn trên thiệp không chọn được (trừ khách đã được xếp sẵn vào bàn đó).
-- Chạy lại an toàn. Giống confirm_seat của 025, thêm kiểm tra VIP.

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
  -- bàn VIP dành riêng: chỉ khách đã được chủ tiệc xếp vào bàn đó mới chọn được
  IF t.vip AND g.table_id IS DISTINCT FROM t.id THEN
    RETURN json_build_object('error', 'TABLE_RESERVED', 'message', 'Bàn này dành riêng cho gia đình. Bạn chọn bàn khác nhé.');
  END IF;
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
