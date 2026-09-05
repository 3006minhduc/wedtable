CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER guests_updated_at
  BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION available_seats(table_id UUID)
RETURNS INT AS $$
  SELECT t.seats - COALESCE(SUM(1 + g.companions), 0)
  FROM tables t
  LEFT JOIN guests g ON g.table_id = t.id AND g.no_show = false
  WHERE t.id = table_id
  GROUP BY t.seats;
$$ LANGUAGE SQL STABLE;
