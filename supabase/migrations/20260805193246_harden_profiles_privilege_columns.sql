/*
# Harden the profiles table against self-granted privileges

## Problem
The `update_own_profile` policy restricted WHICH ROW a user could update
(`auth.uid() = id`) but placed no restriction on WHICH COLUMNS. Because
`anon` and `authenticated` held UPDATE on all columns, any signed-in user
could set `is_admin = true` on their own row and become an administrator,
which also widened the profiles SELECT policy to every user's row and
exposed every registered email address. The same gap let a user rewrite
the `email` and `created_at` values that the admin screen displays.

## Changes
1. Revoke UPDATE, INSERT and DELETE on `public.profiles` from `anon` and
   `authenticated`. Every column of this table is server-derived:
   - `id` comes from auth.users
   - `email` is populated by the signup trigger
   - `is_admin` is only ever set by an administrator (see set_user_admin)
   - `created_at` is a timestamp default
   There is therefore no column a client legitimately writes.
2. SELECT is deliberately left untouched, so the app continues to read the
   signed-in user's profile and administrators continue to read all rows.
3. The `update_own_profile` policy is dropped, since no UPDATE privilege
   remains for it to qualify and leaving it would be misleading.

## Security impact
- Privilege escalation via `is_admin` is closed at the database layer, so it
  is closed for direct data-API calls as well as for the app's own UI.
- The signup trigger `handle_new_user` is SECURITY DEFINER and so continues
  to insert profile rows despite the revoked INSERT grant.
*/

REVOKE UPDATE ON public.profiles FROM anon, authenticated;
REVOKE INSERT ON public.profiles FROM anon, authenticated;
REVOKE DELETE ON public.profiles FROM anon, authenticated;

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
