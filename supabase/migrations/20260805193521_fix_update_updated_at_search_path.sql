/*
# Pin the search_path on the timestamp trigger helper

## Problem
`public.update_updated_at()` was created without a fixed `search_path`, so any
name it resolves is resolved at run time against whatever schema resolution
order is in effect. This is the `function_search_path_mutable` finding from the
database linter.

## Changes
Recreate `public.update_updated_at()` with `SET search_path = public, pg_temp`.
The body is unchanged: it sets `NEW.updated_at` to the current timestamp.

## Important notes
1. The two triggers that use this function (`recipes_updated_at` and
   `notes_updated_at`) reference it by name and continue to work unchanged.
2. EXECUTE grants revoked in the previous migration are re-revoked here,
   because CREATE OR REPLACE restores the default grant to PUBLIC.
*/

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.update_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_updated_at() FROM anon;
REVOKE ALL ON FUNCTION public.update_updated_at() FROM authenticated;
