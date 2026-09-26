CREATE TABLE payments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  amount      INT NOT NULL CHECK (amount >= 10000),
  message     TEXT DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_owner_read" ON payments
  FOR SELECT USING (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));

CREATE POLICY "payments_public_insert" ON payments
  FOR INSERT WITH CHECK (
    status = 'pending'
    AND event_id IN (SELECT id FROM events WHERE published = true)
  );
