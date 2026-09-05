-- Incremental: Clerk Organizations roles (`org:admin` / `org:member`).
-- Run in the Supabase SQL Editor after the original migration.sql.
-- Keeps legacy `admin` / `reader` values until old session JWTs expire.

CREATE OR REPLACE FUNCTION public.requesting_role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(auth.jwt()->>'user_role', 'anon')
$$;

COMMENT ON FUNCTION public.requesting_role() IS
  'Clerk org role from session JWT user_role (org:admin / org:member). JWT role claim stays authenticated.';

-- Groups
DROP POLICY IF EXISTS "groups_auth_read" ON public.groups;
CREATE POLICY "groups_auth_read" ON public.groups
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

DROP POLICY IF EXISTS "groups_admin_insert" ON public.groups;
CREATE POLICY "groups_admin_insert" ON public.groups
  FOR INSERT
  TO authenticated
  WITH CHECK (public.requesting_role() IN ('org:admin', 'admin'));

DROP POLICY IF EXISTS "groups_admin_update" ON public.groups;
CREATE POLICY "groups_admin_update" ON public.groups
  FOR UPDATE
  TO authenticated
  USING (public.requesting_role() IN ('org:admin', 'admin'))
  WITH CHECK (public.requesting_role() IN ('org:admin', 'admin'));

DROP POLICY IF EXISTS "groups_admin_delete" ON public.groups;
CREATE POLICY "groups_admin_delete" ON public.groups
  FOR DELETE
  TO authenticated
  USING (public.requesting_role() IN ('org:admin', 'admin'));

-- Layers
DROP POLICY IF EXISTS "layers_auth_read" ON public.layers;
CREATE POLICY "layers_auth_read" ON public.layers
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

DROP POLICY IF EXISTS "layers_admin_insert" ON public.layers;
CREATE POLICY "layers_admin_insert" ON public.layers
  FOR INSERT
  TO authenticated
  WITH CHECK (public.requesting_role() IN ('org:admin', 'admin'));

DROP POLICY IF EXISTS "layers_admin_update" ON public.layers;
CREATE POLICY "layers_admin_update" ON public.layers
  FOR UPDATE
  TO authenticated
  USING (public.requesting_role() IN ('org:admin', 'admin'))
  WITH CHECK (public.requesting_role() IN ('org:admin', 'admin'));

DROP POLICY IF EXISTS "layers_admin_delete" ON public.layers;
CREATE POLICY "layers_admin_delete" ON public.layers
  FOR DELETE
  TO authenticated
  USING (public.requesting_role() IN ('org:admin', 'admin'));

-- Storage
DROP POLICY IF EXISTS "geojson_admin_insert" ON storage.objects;
CREATE POLICY "geojson_admin_insert" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'geojson'
    AND public.requesting_role() IN ('org:admin', 'admin')
  );

DROP POLICY IF EXISTS "geojson_admin_update" ON storage.objects;
CREATE POLICY "geojson_admin_update" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'geojson'
    AND public.requesting_role() IN ('org:admin', 'admin')
  );

DROP POLICY IF EXISTS "geojson_admin_delete" ON storage.objects;
CREATE POLICY "geojson_admin_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'geojson'
    AND public.requesting_role() IN ('org:admin', 'admin')
  );
