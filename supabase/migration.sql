-- Run this in the Supabase SQL Editor to set up the database.

-- 1. Enable PostGIS (optional, for future spatial queries)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  is_private BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Layers table
CREATE TABLE IF NOT EXISTS public.layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  is_private BOOLEAN NOT NULL DEFAULT false,
  style JSONB NOT NULL DEFAULT '{}',
  legend JSONB NOT NULL DEFAULT '{}',
  geojson_storage_path TEXT,
  bbox FLOAT8[],
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS layers_group_id_idx ON public.layers(group_id);

-- 4. Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layers ENABLE ROW LEVEL SECURITY;

-- 5. Helper: extract app role from Clerk session token.
-- The JWT `role` claim must stay `authenticated` for Supabase.
-- App roles (admin/reader) live in `user_role`.
CREATE OR REPLACE FUNCTION public.requesting_role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(auth.jwt()->>'user_role', 'anon')
$$;

-- 6. RLS Policies for groups

-- Public read: anyone can see non-private groups
CREATE POLICY "groups_public_read" ON public.groups
  FOR SELECT
  USING (is_private = false);

-- Authenticated read: readers and admins see all groups
CREATE POLICY "groups_auth_read" ON public.groups
  FOR SELECT
  TO authenticated
  USING (public.requesting_role() IN ('admin', 'reader'));

-- Admin write
CREATE POLICY "groups_admin_insert" ON public.groups
  FOR INSERT
  TO authenticated
  WITH CHECK (public.requesting_role() = 'admin');

CREATE POLICY "groups_admin_update" ON public.groups
  FOR UPDATE
  TO authenticated
  USING (public.requesting_role() = 'admin')
  WITH CHECK (public.requesting_role() = 'admin');

CREATE POLICY "groups_admin_delete" ON public.groups
  FOR DELETE
  TO authenticated
  USING (public.requesting_role() = 'admin');

-- 7. RLS Policies for layers

CREATE POLICY "layers_public_read" ON public.layers
  FOR SELECT
  USING (is_private = false);

CREATE POLICY "layers_auth_read" ON public.layers
  FOR SELECT
  TO authenticated
  USING (public.requesting_role() IN ('admin', 'reader'));

CREATE POLICY "layers_admin_insert" ON public.layers
  FOR INSERT
  TO authenticated
  WITH CHECK (public.requesting_role() = 'admin');

CREATE POLICY "layers_admin_update" ON public.layers
  FOR UPDATE
  TO authenticated
  USING (public.requesting_role() = 'admin')
  WITH CHECK (public.requesting_role() = 'admin');

CREATE POLICY "layers_admin_delete" ON public.layers
  FOR DELETE
  TO authenticated
  USING (public.requesting_role() = 'admin');

-- 8. Storage bucket for GeoJSON files
INSERT INTO storage.buckets (id, name, public)
VALUES ('geojson', 'geojson', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "geojson_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'geojson');

CREATE POLICY "geojson_admin_insert" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'geojson'
    AND public.requesting_role() = 'admin'
  );

CREATE POLICY "geojson_admin_update" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'geojson'
    AND public.requesting_role() = 'admin'
  );

CREATE POLICY "geojson_admin_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'geojson'
    AND public.requesting_role() = 'admin'
  );
