/*
# Add a privileged, admin-only function for changing a user's role

## Why
Direct UPDATE on `profiles` is now revoked for all client roles, which closes
the self-promotion hole. Administrators still need a way to grant and revoke
the admin role, so that capability moves into a single privileged function
where the caller's own privilege is verified server-side.

## New function
`public.set_user_admin(target_user uuid, make_admin boolean)` returns boolean.

Behaviour and guards, all enforced inside the function:
1. Rejects unauthenticated callers.
2. Rejects any caller for whom `is_admin()` is not true, so only an existing
   administrator can change a role. The check reads the database, never a
   value supplied by the caller.
3. Refuses to let an administrator remove their own admin role, which prevents
   an account from locking the last operator out by accident.
4. Refuses to act on a user id that has no profile row.
5. Runs as SECURITY DEFINER with a fixed `search_path`, so it can write the
   column that clients can no longer write directly.

## Grants
EXECUTE is revoked from `public` and `anon` and granted only to
`authenticated`. Note that the grant alone confers nothing: a signed-in
non-admin calling this function is rejected by guard 2.
*/

CREATE OR REPLACE FUNCTION public.set_user_admin(target_user uuid, make_admin boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller uuid := auth.uid();
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can change roles';
  END IF;

  IF target_user = caller AND make_admin = false THEN
    RAISE EXCEPTION 'You cannot remove your own administrator role';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user) THEN
    RAISE EXCEPTION 'No such user';
  END IF;

  UPDATE public.profiles
  SET is_admin = make_admin
  WHERE id = target_user;

  RETURN make_admin;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_user_admin(uuid, boolean) FROM public;
REVOKE EXECUTE ON FUNCTION public.set_user_admin(uuid, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_user_admin(uuid, boolean) TO authenticated;
