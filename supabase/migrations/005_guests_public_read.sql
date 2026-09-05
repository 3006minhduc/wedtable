CREATE POLICY "guests_public_read" ON guests
  FOR SELECT USING (event_id IN (SELECT id FROM events WHERE published = true));
