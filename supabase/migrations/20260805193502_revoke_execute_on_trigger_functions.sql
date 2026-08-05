/*
# Remove public EXECUTE grants from the trigger helper functions

## Problem
`public.handle_new_user()` is a SECURITY DEFINER function that writes to the
`profiles` table. Because functions in the public schema receive an EXECUTE
grant to `PUBLIC` by default, it was exposed through the data API at
`/rest/v1/rpc/handle_new_user` to both the `anon` and `authenticated` roles.
It is only ever meant to run as the signup trigger on `auth.users`.

## Changes
1. Revoke EXECUTE on `handle_new_user()` from `PUBLIC`, `anon` and
   `authenticated`.
2. Revoke EXECUTE on `update_updated_at()` from the same roles for the same
   reason; it is only ever meant to run as a BEFORE UPDATE trigger.

## Important notes
1. Triggers do NOT consult EXECUTE privileges. Both functions continue to fire
   normally, so profile creation on signup and the `updated_at` timestamps on
   recipes and notes are unaffected.
2. No application code calls either function directly, so no client change is
   needed.
*/

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;

REVOKE ALL ON FUNCTION public.update_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_updated_at() FROM anon;
REVOKE ALL ON FUNCTION public.update_updated_at() FROM authenticated;
