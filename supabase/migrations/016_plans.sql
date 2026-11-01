-- Gói theo từng đám cưới: 'free' | 'premium'.
-- Ưu đãi ra mắt: mọi đám cưới tạo trước 30/6/2027 23:59:59 (giờ VN) tự là Premium (plan_source = 'promo').
-- Người dùng không tự đổi gói được (trigger chặn khi gọi bằng vai trò anon/authenticated).
ALTER TABLE events ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';
ALTER TABLE events ADD COLUMN IF NOT EXISTS plan_source TEXT NOT NULL DEFAULT '';
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_plan_check;
ALTER TABLE events ADD CONSTRAINT events_plan_check CHECK (plan IN ('free', 'premium'));

-- Đám cưới hiện có đều được tạo trong thời gian ưu đãi
UPDATE events SET plan = 'premium', plan_source = 'promo' WHERE plan = 'free' AND created_at <= timestamptz '2027-06-30 23:59:59+07';

CREATE OR REPLACE FUNCTION event_is_premium(p_event uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT plan = 'premium' FROM events WHERE id = p_event), false)
$$;

CREATE OR REPLACE FUNCTION events_plan_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF now() <= timestamptz '2027-06-30 23:59:59+07' THEN
      NEW.plan := 'premium';
      NEW.plan_source := 'promo';
    ELSE
      NEW.plan := 'free';
      NEW.plan_source := '';
      IF EXISTS (SELECT 1 FROM events WHERE user_id = NEW.user_id AND plan = 'free') THEN
        RAISE EXCEPTION 'PLAN_LIMIT_EVENTS';
      END IF;
    END IF;
  ELSIF (NEW.plan IS DISTINCT FROM OLD.plan OR NEW.plan_source IS DISTINCT FROM OLD.plan_source)
        AND COALESCE(auth.role(), '') IN ('anon', 'authenticated') THEN
    NEW.plan := OLD.plan;
    NEW.plan_source := OLD.plan_source;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_events_plan_guard ON events;
CREATE TRIGGER trg_events_plan_guard BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION events_plan_guard();

-- Giới hạn gói Miễn phí: 50 khách
CREATE OR REPLACE FUNCTION guests_plan_limit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT event_is_premium(NEW.event_id) AND (SELECT count(*) FROM guests WHERE event_id = NEW.event_id) >= 50 THEN
    RAISE EXCEPTION 'PLAN_LIMIT_GUESTS';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_guests_plan_limit ON guests;
CREATE TRIGGER trg_guests_plan_limit BEFORE INSERT ON guests FOR EACH ROW EXECUTE FUNCTION guests_plan_limit();

-- 1 tầng
CREATE OR REPLACE FUNCTION floors_plan_limit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT event_is_premium(NEW.event_id) AND (SELECT count(*) FROM floors WHERE event_id = NEW.event_id) >= 1 THEN
    RAISE EXCEPTION 'PLAN_LIMIT_FLOORS';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_floors_plan_limit ON floors;
CREATE TRIGGER trg_floors_plan_limit BEFORE INSERT ON floors FOR EACH ROW EXECUTE FUNCTION floors_plan_limit();

-- Không mời người hỗ trợ
CREATE OR REPLACE FUNCTION members_plan_limit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT event_is_premium(NEW.event_id) THEN
    RAISE EXCEPTION 'PLAN_LIMIT_MEMBERS';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_members_plan_limit ON event_members;
CREATE TRIGGER trg_members_plan_limit BEFORE INSERT ON event_members FOR EACH ROW EXECUTE FUNCTION members_plan_limit();

-- Không có bàn dài
CREATE OR REPLACE FUNCTION tables_plan_limit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.shape = 'rect' AND NOT event_is_premium(NEW.event_id) THEN
    RAISE EXCEPTION 'PLAN_LIMIT_SHAPE';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_tables_plan_limit ON tables;
CREATE TRIGGER trg_tables_plan_limit BEFORE INSERT OR UPDATE OF shape ON tables FOR EACH ROW EXECUTE FUNCTION tables_plan_limit();
