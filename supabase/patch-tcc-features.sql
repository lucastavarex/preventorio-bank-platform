-- Run this in the Supabase SQL Editor if migration.sql already ran.
-- Provenance + popup on layers, saved maps, private GeoJSON bucket.

ALTER TABLE public.layers
  ADD COLUMN IF NOT EXISTS provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS popup JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  is_private BOOLEAN NOT NULL DEFAULT false,
  basemap_id TEXT NOT NULL DEFAULT 'streets',
  camera JSONB NOT NULL DEFAULT '{}'::jsonb,
  layers JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.maps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "maps_public_read" ON public.maps;
CREATE POLICY "maps_public_read" ON public.maps
  FOR SELECT
  USING (is_private = false);

DROP POLICY IF EXISTS "maps_auth_read" ON public.maps;
CREATE POLICY "maps_auth_read" ON public.maps
  FOR SELECT
  TO authenticated
  USING (
    public.requesting_role() IN (
      'org:admin',
      'org:member',
      'admin',
      'reader'
    )
  );

DROP POLICY IF EXISTS "maps_admin_insert" ON public.maps;
CREATE POLICY "maps_admin_insert" ON public.maps
  FOR INSERT
  TO authenticated
  WITH CHECK (public.requesting_role() IN ('org:admin', 'admin'));

DROP POLICY IF EXISTS "maps_admin_update" ON public.maps;
CREATE POLICY "maps_admin_update" ON public.maps
  FOR UPDATE
  TO authenticated
  USING (public.requesting_role() IN ('org:admin', 'admin'))
  WITH CHECK (public.requesting_role() IN ('org:admin', 'admin'));

DROP POLICY IF EXISTS "maps_admin_delete" ON public.maps;
CREATE POLICY "maps_admin_delete" ON public.maps
  FOR DELETE
  TO authenticated
  USING (public.requesting_role() IN ('org:admin', 'admin'));

UPDATE storage.buckets
SET public = false
WHERE id = 'geojson';

DROP POLICY IF EXISTS "geojson_public_read" ON storage.objects;
