-- ─── Migration: Add image_url fields to shops and menu_items ───────────────
--
-- Adds:
--   image_url to public.shops
--   image_url to public.menu_items
--
-- Also creates the public bucket "canteen-images" and sets up RLS policies
-- (Note: bucket creation might need to be run as superuser or via dashboard,
-- but standard SQL inserts work if permissions allow).
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Attempt to create the storage bucket (may require superuser or running from dashboard)
INSERT INTO storage.buckets (id, name, public)
VALUES ('canteen-images', 'canteen-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for the bucket (Assuming public read, authenticated insert/update)
-- Allow public access to view images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'canteen-images' );

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'canteen-images' );

-- Allow authenticated users to update/delete their images
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'canteen-images' );

CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'canteen-images' );
