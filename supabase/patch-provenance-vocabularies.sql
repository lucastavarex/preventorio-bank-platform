-- Run this in the Supabase SQL Editor if migration.sql already ran.
-- Moves the provenance vocabularies (source, theme, hazard, participation,
-- license, producers) out of the app code into admin-managed tables.
--
-- layers.provenance keeps storing slugs, so seeding the tables with the slugs
-- the app already used means existing layers need no rewrite. The two fields
-- that were free text (license, producers) are converted at the end.

-- 1. Slug helper (also used by the app when an admin leaves the slug blank).
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

-- 2. The six vocabulary tables. Same shape everywhere, so they are created in a
-- loop: id, slug (what provenance stores), label (what the UI shows),
-- is_active (retire a term without breaking old layers) and sort_order.
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

    -- Read is open to everyone: the public fact sheet needs these labels and
    -- a vocabulary carries no sensitive data.
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

-- 3. Seed with the vocabulary the app had hardcoded in lib/provenance.ts.
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

-- 4. Licences: promote every distinct free-text value to a term, then rewrite
-- the layer field to the matching slug.
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

-- Blank licences map to no term at all.
UPDATE public.layers
SET provenance = provenance - 'license'
WHERE jsonb_typeof(provenance->'license') = 'string'
  AND public.provenance_slugify(provenance->>'license') IS NULL;

-- 5. Producers: the field held a comma separated list ("LABIS, BCP, URBE
-- Latam"), so each part becomes a term and the field becomes an array of slugs.
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

-- Anything still a string here had no usable name in it.
UPDATE public.layers
SET provenance = provenance - 'producers'
WHERE jsonb_typeof(provenance->'producers') = 'string';
