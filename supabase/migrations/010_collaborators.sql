-- EVENT MEMBERS (collaborators with a scoped role)
CREATE TABLE event_members (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('design', 'setup', 'checkin')),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (event_id, email)
);

CREATE INDEX idx_event_members_event ON event_members(event_id);
CREATE INDEX idx_event_members_user ON event_members(user_id);

ALTER TABLE event_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_members_owner_all" ON event_members
  USING (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()))
  WITH CHECK (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));

CREATE POLICY "event_members_self_select" ON event_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
  );

-- HELPER: does the current user have one of the given roles (or own) the event?
CREATE OR REPLACE FUNCTION has_event_role(p_event_id UUID, p_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM events e WHERE e.id = p_event_id AND e.user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM event_members m
      WHERE m.event_id = p_event_id
        AND m.role = ANY(p_roles)
        AND (m.user_id = auth.uid() OR lower(m.email) = lower(COALESCE(auth.jwt() ->> 'email', '')))
    );
$$;

GRANT EXECUTE ON FUNCTION has_event_role(UUID, TEXT[]) TO authenticated;

-- Attach pending invites to the logged-in user by matching email
CREATE OR REPLACE FUNCTION claim_invites()
RETURNS VOID
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE event_members
  SET user_id = auth.uid()
  WHERE user_id IS NULL
    AND lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''));
$$;

GRANT EXECUTE ON FUNCTION claim_invites() TO authenticated;

-- EVENTS: members can read; design members can update
CREATE POLICY "events_member_select" ON events
  FOR SELECT USING (has_event_role(id, ARRAY['design', 'setup', 'checkin']));

CREATE POLICY "events_member_update" ON events
  FOR UPDATE USING (has_event_role(id, ARRAY['design']))
  WITH CHECK (has_event_role(id, ARRAY['design']));

-- FLOORS: design + setup can manage, checkin can read
CREATE POLICY "floors_member_select" ON floors
  FOR SELECT USING (has_event_role(event_id, ARRAY['design', 'setup', 'checkin']));

CREATE POLICY "floors_member_write" ON floors
  FOR ALL USING (has_event_role(event_id, ARRAY['design', 'setup']))
  WITH CHECK (has_event_role(event_id, ARRAY['design', 'setup']));

-- TABLES: design + setup can manage, checkin can read
CREATE POLICY "tables_member_select" ON tables
  FOR SELECT USING (has_event_role(event_id, ARRAY['design', 'setup', 'checkin']));

CREATE POLICY "tables_member_write" ON tables
  FOR ALL USING (has_event_role(event_id, ARRAY['design', 'setup']))
  WITH CHECK (has_event_role(event_id, ARRAY['design', 'setup']));

-- GUESTS: setup + checkin can manage (design has no access to guest privacy data)
CREATE POLICY "guests_member_all" ON guests
  USING (has_event_role(event_id, ARRAY['setup', 'checkin']))
  WITH CHECK (has_event_role(event_id, ARRAY['setup', 'checkin']));
