-- StayOnStay: Up to 3 cover images per hotel (carousel on listing + detail)
-- Run after 20250315000017_amenities_landmarks_pricing.sql

CREATE TABLE IF NOT EXISTS public.hotel_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT hotel_images_sort_order_range CHECK (sort_order >= 0 AND sort_order <= 2)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_hotel_images_hotel_sort ON public.hotel_images(hotel_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_hotel_images_hotel_id ON public.hotel_images(hotel_id);

ALTER TABLE public.hotel_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hotel_images_owner_all" ON public.hotel_images;
CREATE POLICY "hotel_images_owner_all"
  ON public.hotel_images FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.hotels h
      WHERE h.id = hotel_images.hotel_id
        AND h.owner_id = auth.uid()
        AND h.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hotels h
      WHERE h.id = hotel_images.hotel_id
        AND h.owner_id = auth.uid()
        AND h.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS "hotel_images_admin_all" ON public.hotel_images;
CREATE POLICY "hotel_images_admin_all"
  ON public.hotel_images FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "hotel_images_public_read" ON public.hotel_images;
CREATE POLICY "hotel_images_public_read"
  ON public.hotel_images FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.hotels h
      WHERE h.id = hotel_images.hotel_id
        AND h.deleted_at IS NULL
    )
  );
