UPDATE storage.buckets SET public = true WHERE id = 'wedding-media';

CREATE POLICY "owner_delete_media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'wedding-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
