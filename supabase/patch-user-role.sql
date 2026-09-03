-- Run this in the Supabase SQL Editor if migration.sql already ran.
-- Reads the app role from the Clerk session token claim `user_role`.

CREATE OR REPLACE FUNCTION public.requesting_role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(auth.jwt()->>'user_role', 'anon')
$$;
