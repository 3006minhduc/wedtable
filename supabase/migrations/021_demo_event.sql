-- Đám cưới mẫu ("Xem thử với đám cưới mẫu"): events.is_demo = true.
--  - luôn là Premium để người dùng thử đủ tính năng, nhưng KHÔNG tính vào giới hạn 1 đám cưới miễn phí
--  - không công khai được (khách không mở được link) nên không dùng thay đám cưới thật
--  - người dùng không tự bật/tắt cờ này được (chỉ đổi trong Supabase)
-- Thay events_plan_guard của migration 016. Chạy lại an toàn.
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION events_plan_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_demo THEN
      NEW.plan := 'premium';
      NEW.plan_source := 'demo';
      NEW.published := false;
    ELSIF now() <= timestamptz '2027-06-30 23:59:59+07' THEN
      NEW.plan := 'premium';
      NEW.plan_source := 'promo';
    ELSE
      NEW.plan := 'free';
      NEW.plan_source := '';
      IF EXISTS (SELECT 1 FROM events WHERE user_id = NEW.user_id AND plan = 'free' AND NOT is_demo) THEN
        RAISE EXCEPTION 'PLAN_LIMIT_EVENTS';
      END IF;
    END IF;
  ELSE
    IF COALESCE(auth.role(), '') IN ('anon', 'authenticated') THEN
      IF NEW.plan IS DISTINCT FROM OLD.plan OR NEW.plan_source IS DISTINCT FROM OLD.plan_source THEN
        NEW.plan := OLD.plan;
        NEW.plan_source := OLD.plan_source;
      END IF;
      NEW.is_demo := OLD.is_demo;
    END IF;
    -- a demo wedding can never be opened by guests
    IF NEW.is_demo THEN
      NEW.published := false;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_events_plan_guard ON events;
CREATE TRIGGER trg_events_plan_guard BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION events_plan_guard();
