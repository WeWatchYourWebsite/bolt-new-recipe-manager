/*
# Require a note's recipe to belong to the note's owner

## Problem
The `insert_own_notes` and `update_own_notes` policies checked only that the
note belonged to the caller (`auth.uid() = user_id`). They did not check that
`recipe_id` referred to a recipe the caller owns, and the foreign key to
`recipes(id)` is validated without regard to row level security. A signed-in
user could therefore post a note referencing another user's recipe id.

## Changes
Recreate the notes INSERT and UPDATE policies so that, in addition to owning
the note, the caller must own the recipe the note is attached to. SELECT and
DELETE remain keyed on `auth.uid() = user_id`, which is correct: a user must
always be able to read and remove their own notes even if the parent recipe
has since changed.

## Security impact
Notes can no longer be bound to recipes outside the caller's own collection,
so the parent-child ownership invariant is now enforced by the database rather
than assumed by the interface.
*/

DROP POLICY IF EXISTS "insert_own_notes" ON public.notes;
CREATE POLICY "insert_own_notes" ON public.notes FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = notes.recipe_id AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_own_notes" ON public.notes;
CREATE POLICY "update_own_notes" ON public.notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = notes.recipe_id AND r.user_id = auth.uid()
    )
  );
