/*
# Recipe Manager Schema

## Overview
Creates the full schema for a private recipe manager: user profiles with admin roles,
recipes, collections, a join table for recipes-in-collections, and private notes.
Every user's data is isolated via Row Level Security.

## Tables

### profiles
- `id` (uuid, PK, references auth.users) — one row per user
- `email` (text) — cached for admin display
- `is_admin` (boolean, default false) — admin role flag
- `created_at` (timestamptz)

### recipes
- `id` (uuid PK)
- `user_id` (uuid, references profiles, default auth.uid()) — owner
- `title` (text, not null)
- `description` (text)
- `ingredients` (text[]) — list of ingredients
- `instructions` (text[]) — ordered steps
- `prep_time_minutes` (int)
- `cook_time_minutes` (int)
- `servings` (int)
- `image_url` (text) — optional photo URL
- `tags` (text[]) — user tags like "dessert", "quick"
- `created_at`, `updated_at` (timestamptz)

### collections
- `id` (uuid PK)
- `user_id` (uuid, references profiles, default auth.uid()) — owner
- `name` (text, not null)
- `description` (text)
- `color` (text) — accent color for the collection
- `created_at` (timestamptz)

### recipe_collections
- Join table: `recipe_id` + `collection_id` composite PK
- Both columns have ON DELETE CASCADE so removing a recipe or collection cleans up

### notes
- `id` (uuid PK)
- `recipe_id` (uuid, references recipes, ON DELETE CASCADE)
- `user_id` (uuid, references profiles, default auth.uid()) — owner of the note
- `content` (text, not null)
- `created_at`, `updated_at` (timestamptz)
- Notes are private per user — each user sees only their own notes on a recipe.

## Security (RLS)

All tables have RLS enabled. Policies:
- **profiles**: users can read/update their own profile. Admins can read all profiles.
- **recipes**: full CRUD scoped to owner via auth.uid() = user_id.
- **collections**: full CRUD scoped to owner.
- **recipe_collections**: scoped through ownership of both parent recipe and parent collection.
- **notes**: full CRUD scoped to owner (auth.uid() = user_id).

Admin role is determined by `profiles.is_admin` checked via a SECURITY DEFINER function
`is_admin()` so policies can reference it without circular RLS issues.

## Important Notes
1. `user_id` columns default to `auth.uid()` so frontend inserts that omit user_id succeed.
2. A trigger `handle_new_user` auto-creates a profile row when a new auth user signs up.
3. The `is_admin()` SECURITY DEFINER function bypasses RLS to check the profiles table.
4. All policies are idempotent (DROP IF EXISTS before CREATE).
*/

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- is_admin() helper — SECURITY DEFINER so it can read profiles bypassing RLS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Profiles policies
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR is_admin());

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================
-- RECIPES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  ingredients text[] NOT NULL DEFAULT '{}',
  instructions text[] NOT NULL DEFAULT '{}',
  prep_time_minutes int DEFAULT 0,
  cook_time_minutes int DEFAULT 0,
  servings int DEFAULT 1,
  image_url text DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_recipes" ON recipes;
CREATE POLICY "select_own_recipes" ON recipes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_recipes" ON recipes;
CREATE POLICY "insert_own_recipes" ON recipes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_recipes" ON recipes;
CREATE POLICY "update_own_recipes" ON recipes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_recipes" ON recipes;
CREATE POLICY "delete_own_recipes" ON recipes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- COLLECTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  color text DEFAULT 'amber',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_collections" ON collections;
CREATE POLICY "select_own_collections" ON collections FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_collections" ON collections;
CREATE POLICY "insert_own_collections" ON collections FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_collections" ON collections;
CREATE POLICY "update_own_collections" ON collections FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_collections" ON collections;
CREATE POLICY "delete_own_collections" ON collections FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- RECIPE_COLLECTIONS JOIN TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS recipe_collections (
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (recipe_id, collection_id)
);

ALTER TABLE recipe_collections ENABLE ROW LEVEL SECURITY;

-- User can only link/unlink recipes they own to collections they own
DROP POLICY IF EXISTS "select_own_recipe_collections" ON recipe_collections;
CREATE POLICY "select_own_recipe_collections" ON recipe_collections FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM collections c WHERE c.id = collection_id AND c.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_recipe_collections" ON recipe_collections;
CREATE POLICY "insert_own_recipe_collections" ON recipe_collections FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM collections c WHERE c.id = collection_id AND c.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_recipe_collections" ON recipe_collections;
CREATE POLICY "delete_own_recipe_collections" ON recipe_collections FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM collections c WHERE c.id = collection_id AND c.user_id = auth.uid())
  );

-- ============================================================
-- NOTES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Notes are private: user can only see/manage notes on recipes they own
DROP POLICY IF EXISTS "select_own_notes" ON notes;
CREATE POLICY "select_own_notes" ON notes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notes" ON notes;
CREATE POLICY "insert_own_notes" ON notes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notes" ON notes;
CREATE POLICY "update_own_notes" ON notes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notes" ON notes;
CREATE POLICY "delete_own_notes" ON notes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_recipe_id ON notes(recipe_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_collections_recipe_id ON recipe_collections(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_collections_collection_id ON recipe_collections(collection_id);

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- TRIGGER: update updated_at on recipes
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS recipes_updated_at ON recipes;
CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS notes_updated_at ON notes;
CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
