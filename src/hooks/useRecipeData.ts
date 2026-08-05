import { useCallback, useEffect, useState } from 'react';
import { supabase, type Recipe, type Collection, type Note } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export function useRecipes() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecipes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setRecipes(data as Recipe[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  return { recipes, loading, refresh: fetchRecipes, setRecipes };
}

export function useCollections() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCollections = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setCollections(data as Collection[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  return { collections, loading, refresh: fetchCollections, setCollections };
}

export function useRecipe(recipeId: string | null) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!recipeId) {
      setRecipe(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .maybeSingle()
      .then(({ data }) => {
        setRecipe(data as Recipe | null);
        setLoading(false);
      });
  }, [recipeId]);

  return { recipe, loading, setRecipe };
}

export function useNotes(recipeId: string | null) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    if (!recipeId || !user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('created_at', { ascending: false });
    if (!error && data) setNotes(data as Note[]);
    setLoading(false);
  }, [recipeId, user]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return { notes, loading, refresh: fetchNotes, setNotes };
}

export function useRecipeCollections(recipeId: string | null) {
  const { user } = useAuth();
  const [linkedCollectionIds, setLinkedCollectionIds] = useState<string[]>([]);

  const fetchLinks = useCallback(async () => {
    if (!recipeId || !user) return;
    const { data } = await supabase
      .from('recipe_collections')
      .select('collection_id')
      .eq('recipe_id', recipeId);
    if (data) setLinkedCollectionIds(data.map((d) => d.collection_id as string));
  }, [recipeId, user]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  return { linkedCollectionIds, refresh: fetchLinks, setLinkedCollectionIds };
}
