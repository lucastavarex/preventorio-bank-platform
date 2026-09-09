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
  title TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  is_private BOOLEAN NOT NULL DEFAULT false,
  style JSONB NOT NULL DEFAULT '{}',
  legend JSONB NOT NULL DEFAULT '{}',
  provenance JSONB NOT NULL DEFAULT '{}',
  popup JSONB NOT NULL DEFAULT '{}',
  geojson_storage_path TEXT,
  bbox FLOAT8[],
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Layer/group membership (many-to-many).
-- The composite primary key is what lets PostgREST detect the N:N
-- relationship and keep `groups(*, layers(*))` embedding working.
CREATE TABLE IF NOT EXISTS public.layer_groups (
  layer_id UUID NOT NULL REFERENCES public.layers(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  PRIMARY KEY (layer_id, group_id)
);

CREATE INDEX IF NOT EXISTS layer_groups_group_id_idx
  ON public.layer_groups(group_id);

-- 5. Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layer_groups ENABLE ROW LEVEL SECURITY;

-- 6. Helper: extract org role from Clerk session token.
-- The JWT `role` claim must stay `authenticated` for Supabase.
-- App roles live in `user_role` (`org:admin` / `org:member`).
CREATE OR REPLACE FUNCTION public.requesting_role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(auth.jwt()->>'user_role', 'anon')
$$;

-- 7. RLS Policies for groups

-- Public read: anyone can see non-private groups
CREATE POLICY "groups_public_read" ON public.groups
  FOR SELECT
  USING (is_private = false);

-- Authenticated read: org members and admins see all groups
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

-- Admin write
CREATE POLICY "groups_admin_insert" ON public.groups
  FOR INSERT
  TO authenticated
  WITH CHECK (public.requesting_role() IN ('org:admin', 'admin'));

CREATE POLICY "groups_admin_update" ON public.groups
  FOR UPDATE
  TO authenticated
  USING (public.requesting_role() IN ('org:admin', 'admin'))
  WITH CHECK (public.requesting_role() IN ('org:admin', 'admin'));

CREATE POLICY "groups_admin_delete" ON public.groups
  FOR DELETE
  TO authenticated
  USING (public.requesting_role() IN ('org:admin', 'admin'));

-- 8. RLS Policies for layers

CREATE POLICY "layers_public_read" ON public.layers
  FOR SELECT
  USING (is_private = false);

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

CREATE POLICY "layers_admin_insert" ON public.layers
  FOR INSERT
  TO authenticated
  WITH CHECK (public.requesting_role() IN ('org:admin', 'admin'));

CREATE POLICY "layers_admin_update" ON public.layers
  FOR UPDATE
  TO authenticated
  USING (public.requesting_role() IN ('org:admin', 'admin'))
  WITH CHECK (public.requesting_role() IN ('org:admin', 'admin'));

CREATE POLICY "layers_admin_delete" ON public.layers
  FOR DELETE
  TO authenticated
  USING (public.requesting_role() IN ('org:admin', 'admin'));

-- 9. RLS Policies for layer_groups

-- Anonymous readers only see memberships where both sides are public, so a
-- private layer id never leaks through the join table.
CREATE POLICY "layer_groups_public_read" ON public.layer_groups
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.layers l
      WHERE l.id = layer_id AND l.is_private = false
    )
    AND EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_id AND g.is_private = false
    )
  );

CREATE POLICY "layer_groups_auth_read" ON public.layer_groups
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

CREATE POLICY "layer_groups_admin_insert" ON public.layer_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (public.requesting_role() IN ('org:admin', 'admin'));

CREATE POLICY "layer_groups_admin_update" ON public.layer_groups
  FOR UPDATE
  TO authenticated
  USING (public.requesting_role() IN ('org:admin', 'admin'))
  WITH CHECK (public.requesting_role() IN ('org:admin', 'admin'));

CREATE POLICY "layer_groups_admin_delete" ON public.layer_groups
  FOR DELETE
  TO authenticated
  USING (public.requesting_role() IN ('org:admin', 'admin'));

-- 10. Saved map compositions
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

CREATE POLICY "maps_public_read" ON public.maps
  FOR SELECT
  USING (is_private = false);

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

CREATE POLICY "maps_admin_insert" ON public.maps
  FOR INSERT
  TO authenticated
  WITH CHECK (public.requesting_role() IN ('org:admin', 'admin'));

CREATE POLICY "maps_admin_update" ON public.maps
  FOR UPDATE
  TO authenticated
  USING (public.requesting_role() IN ('org:admin', 'admin'))
  WITH CHECK (public.requesting_role() IN ('org:admin', 'admin'));

CREATE POLICY "maps_admin_delete" ON public.maps
  FOR DELETE
  TO authenticated
  USING (public.requesting_role() IN ('org:admin', 'admin'));

-- 11. Storage bucket for GeoJSON files (private; read via signed URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('geojson', 'geojson', false)
ON CONFLICT (id) DO UPDATE SET public = false;

CREATE POLICY "geojson_admin_insert" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'geojson'
    AND public.requesting_role() IN ('org:admin', 'admin')
  );

CREATE POLICY "geojson_admin_update" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'geojson'
    AND public.requesting_role() IN ('org:admin', 'admin')
  );

CREATE POLICY "geojson_admin_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'geojson'
    AND public.requesting_role() IN ('org:admin', 'admin')
  );

-- 12. Provenance vocabularies (admin-managed lists behind layers.provenance).
-- layers.provenance stores the `slug` of a term, never its uuid.

CREATE OR REPLACE FUNCTION public.provenance_slugify(value TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(
    trim(BOTH '-' FROM regexp_replace(
      lower(translate(
        coalesce(trim(value), ''),
        'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
        'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
      )),
      '[^a-z0-9]+', '-', 'g'
    )),
    ''
  )
$$;

-- Same shape for all six, so they are created in a loop. Read is open to
-- everyone because the public fact sheet needs the labels; write is admin only.
DO $$
DECLARE
  vocab TEXT;
BEGIN
  FOREACH vocab IN ARRAY ARRAY[
    'provenance_sources',
    'provenance_themes',
    'provenance_hazards',
    'participation_levels',
    'provenance_licenses',
    'provenance_producers'
  ] LOOP
    EXECUTE format($ddl$
      CREATE TABLE IF NOT EXISTS public.%I (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug TEXT NOT NULL UNIQUE,
        label TEXT NOT NULL,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    $ddl$, vocab);

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', vocab);

    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      vocab || '_public_read', vocab
    );
    EXECUTE format($pol$
      CREATE POLICY %I ON public.%I
        FOR SELECT
        USING (true)
    $pol$, vocab || '_public_read', vocab);

    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      vocab || '_admin_insert', vocab
    );
    EXECUTE format($pol$
      CREATE POLICY %I ON public.%I
        FOR INSERT
        TO authenticated
        WITH CHECK (public.requesting_role() IN ('org:admin', 'admin'))
    $pol$, vocab || '_admin_insert', vocab);

    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      vocab || '_admin_update', vocab
    );
    EXECUTE format($pol$
      CREATE POLICY %I ON public.%I
        FOR UPDATE
        TO authenticated
        USING (public.requesting_role() IN ('org:admin', 'admin'))
        WITH CHECK (public.requesting_role() IN ('org:admin', 'admin'))
    $pol$, vocab || '_admin_update', vocab);

    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      vocab || '_admin_delete', vocab
    );
    EXECUTE format($pol$
      CREATE POLICY %I ON public.%I
        FOR DELETE
        TO authenticated
        USING (public.requesting_role() IN ('org:admin', 'admin'))
    $pol$, vocab || '_admin_delete', vocab);
  END LOOP;
END $$;

INSERT INTO public.provenance_sources (slug, label, sort_order) VALUES
  ('osm', 'OpenStreetMap', 0),
  ('kobo', 'KoboToolbox', 1),
  ('workshop', 'Oficina comunitária', 2),
  ('qgis', 'QGIS', 3),
  ('other', 'Outro', 4)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.provenance_themes (slug, label, sort_order) VALUES
  ('physical_vulnerability', 'Vulnerabilidade física', 0),
  ('risk_perception', 'Percepção de risco', 1),
  ('infrastructure', 'Infraestrutura', 2),
  ('overlay', 'Cruzamento / sobreposição', 3),
  ('other', 'Outro', 4)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.provenance_hazards (slug, label, sort_order) VALUES
  ('landslide', 'Deslizamento de terra', 0),
  ('rockfall', 'Deslizamento de rocha', 1),
  ('hydrological', 'Eventos hídricos', 2),
  ('none', 'Não se aplica', 3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.participation_levels (slug, label, sort_order) VALUES
  ('low', 'Baixo', 0),
  ('medium', 'Médio', 1),
  ('high', 'Alto', 2)
ON CONFLICT (slug) DO NOTHING;

-- Licences and producers start empty on a brand-new database. The conversion
-- below is a no-op unless layers already carry free-text values (the same
-- statements live in patch-provenance-vocabularies.sql for existing projects).
INSERT INTO public.provenance_licenses (slug, label)
SELECT public.provenance_slugify(name) AS slug, min(name) AS label
FROM (
  SELECT trim(l.provenance->>'license') AS name
  FROM public.layers l
  WHERE jsonb_typeof(l.provenance->'license') = 'string'
) raw
WHERE public.provenance_slugify(name) IS NOT NULL
GROUP BY public.provenance_slugify(name)
ON CONFLICT (slug) DO NOTHING;

UPDATE public.layers l
SET provenance = jsonb_set(l.provenance, '{license}', to_jsonb(p.slug))
FROM public.provenance_licenses p
WHERE jsonb_typeof(l.provenance->'license') = 'string'
  AND p.slug = public.provenance_slugify(l.provenance->>'license')
  AND l.provenance->>'license' <> p.slug;

UPDATE public.layers
SET provenance = provenance - 'license'
WHERE jsonb_typeof(provenance->'license') = 'string'
  AND public.provenance_slugify(provenance->>'license') IS NULL;

INSERT INTO public.provenance_producers (slug, label)
SELECT public.provenance_slugify(name) AS slug, min(name) AS label
FROM (
  SELECT trim(parts.name) AS name
  FROM public.layers l,
       LATERAL unnest(
         string_to_array(l.provenance->>'producers', ',')
       ) AS parts(name)
  WHERE jsonb_typeof(l.provenance->'producers') = 'string'
) raw
WHERE public.provenance_slugify(name) IS NOT NULL
GROUP BY public.provenance_slugify(name)
ON CONFLICT (slug) DO NOTHING;

UPDATE public.layers l
SET provenance = jsonb_set(l.provenance, '{producers}', mapped.slugs)
FROM (
  SELECT src.id, jsonb_agg(DISTINCT p.slug) AS slugs
  FROM public.layers src,
       LATERAL unnest(
         string_to_array(src.provenance->>'producers', ',')
       ) AS parts(name)
  JOIN public.provenance_producers p
    ON p.slug = public.provenance_slugify(parts.name)
  WHERE jsonb_typeof(src.provenance->'producers') = 'string'
  GROUP BY src.id
) mapped
WHERE l.id = mapped.id;

UPDATE public.layers
SET provenance = provenance - 'producers'
WHERE jsonb_typeof(provenance->'producers') = 'string';
