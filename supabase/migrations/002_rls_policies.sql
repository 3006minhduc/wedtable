-- EVENTS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_owner_all" ON events
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "events_public_read" ON events
  FOR SELECT USING (published = true);

-- FLOORS
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "floors_owner_all" ON floors
  USING (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));

CREATE POLICY "floors_public_read" ON floors
  FOR SELECT USING (
    event_id IN (SELECT id FROM events WHERE published = true)
  );

-- TABLES
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tables_owner_all" ON tables
  USING (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));

CREATE POLICY "tables_public_read" ON tables
  FOR SELECT USING (
    event_id IN (SELECT id FROM events WHERE published = true)
  );

-- GUESTS
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guests_owner_all" ON guests
  USING (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));

CREATE POLICY "guests_self_read" ON guests
  FOR SELECT USING (true);
