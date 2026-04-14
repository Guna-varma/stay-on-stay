-- Optional saved link to the hotel's Google Maps place (owner-provided)

ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS google_maps_url TEXT;

COMMENT ON COLUMN public.hotels.google_maps_url IS
  'Owner-provided Google Maps URL for the property; used for display / future map embeds.';