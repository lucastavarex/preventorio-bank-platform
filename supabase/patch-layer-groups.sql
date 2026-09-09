-- Run this in the Supabase SQL Editor if migration.sql already ran.
-- Moves layer/group membership from layers.group_id to a join table so a
-- layer can belong to many groups.

CREATE TABLE IF NOT EXISTS public.layer_groups (
  layer_id UUID NOT NULL REFERENCES public.layers(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  PRIMARY KEY (layer_id, group_id)
);

CREATE INDEX IF NOT EXISTS layer_groups_group_id_idx
  ON public.layer_groups(group_id);

ALTER TABLE public.layer_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "layer_groups_public_read" ON public.layer_groups;
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

DROP POLICY IF EXISTS "layer_groups_auth_read" ON public.layer_groups;
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

DROP POLICY IF EXISTS "layer_groups_admin_insert" ON public.layer_groups;
CREATE POLICY "layer_groups_admin_insert" ON public.layer_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (public.requesting_role() IN ('org:admin', 'admin'));

DROP POLICY IF EXISTS "layer_groups_admin_update" ON public.layer_groups;
CREATE POLICY "layer_groups_admin_update" ON public.layer_groups
  FOR UPDATE
  TO authenticated
  USING (public.requesting_role() IN ('org:admin', 'admin'))
  WITH CHECK (public.requesting_role() IN ('org:admin', 'admin'));

DROP POLICY IF EXISTS "layer_groups_admin_delete" ON public.layer_groups;
CREATE POLICY "layer_groups_admin_delete" ON public.layer_groups
  FOR DELETE
  TO authenticated
  USING (public.requesting_role() IN ('org:admin', 'admin'));

-- Copy the existing 1:N memberships before dropping the column.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'layers'
      AND column_name = 'group_id'
  ) THEN
    INSERT INTO public.layer_groups (layer_id, group_id)
    SELECT id, group_id FROM public.layers WHERE group_id IS NOT NULL
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

DROP INDEX IF EXISTS public.layers_group_id_idx;
ALTER TABLE public.layers DROP COLUMN IF EXISTS group_id;
