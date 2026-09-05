INSERT INTO storage.buckets (id, name, public)
VALUES ('wedding-media', 'wedding-media', false);

CREATE POLICY "owner_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'wedding-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "public_read_media" ON storage.objects
  FOR SELECT USING (bucket_id = 'wedding-media');

ALTER PUBLICATION supabase_realtime ADD TABLE guests;
ALTER PUBLICATION supabase_realtime ADD TABLE tables;
