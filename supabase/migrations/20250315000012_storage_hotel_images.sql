-- StayOnStay: Storage bucket for hotel images (compressed uploads)
-- Run after 20250315000011. Required for hotel create/edit with image upload.

-- Create public bucket so getPublicUrl() works for guest-facing hotel images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hotel-images',
  'hotel-images',
  true,
  524288,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Owners upload to their own folder: path = owner_id/...
DROP POLICY IF EXISTS "hotel_images_owner_upload" ON storage.objects;
CREATE POLICY "hotel_images_owner_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'hotel-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owners can update/delete their own files
DROP POLICY IF EXISTS "hotel_images_owner_update" ON storage.objects;
CREATE POLICY "hotel_images_owner_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'hotel-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'hotel-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "hotel_images_owner_delete" ON storage.objects;
CREATE POLICY "hotel_images_owner_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'hotel-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read is implied by bucket public = true; no extra policy needed for SELECT.
