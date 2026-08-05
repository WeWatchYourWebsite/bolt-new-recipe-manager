import { useState } from 'react';
import { Search, Plus, X } from 'lucide-react';
import type { Recipe } from '@/lib/supabase';
import RecipeCard from './RecipeCard';

type Props = {
  recipes: Recipe[];
  loading: boolean;
  onRecipeClick: (recipe: Recipe) => void;
  onAddRecipe: () => void;
  title?: string;
  emptyMessage?: string;
};

export default function RecipeGrid({
  recipes,
  loading,
  onRecipeClick,
  onAddRecipe,
  title = 'All Recipes',
  emptyMessage = 'No recipes yet',
}: Props) {
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const allTags = [...new Set(recipes.flatMap((r) => r.tags))].sort();

  const filtered = recipes.filter((r) => {
    const matchesSearch =
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.ingredients.some((i) => i.toLowerCase().includes(search.toLowerCase()));
    const matchesTag = !tagFilter || r.tags.includes(tagFilter);
    return matchesSearch && matchesTag;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 tracking-tight">{title}</h2>
          <p className="text-sm text-stone-500 mt-0.5">
            {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
          </p>
        </div>
        <button
          onClick={onAddRecipe}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-medium text-sm hover:bg-amber-700 active:scale-95 transition-all shadow-lg shadow-amber-600/20"
        >
          <Plus className="w-4 h-4" />
          New Recipe
        </button>
      </div>

      {/* Search + Tags */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipes, ingredients..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all text-sm"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  tagFilter === tag
                    ? 'bg-amber-600 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-100 overflow-hidden animate-pulse">
              <div className="h-44 bg-stone-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-stone-100 rounded w-3/4" />
                <div className="h-3 bg-stone-100 rounded w-full" />
                <div className="h-3 bg-stone-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
            <Search className="w-7 h-7 text-stone-300" />
          </div>
          <p className="text-stone-400 mb-1">{search || tagFilter ? 'No matching recipes' : emptyMessage}</p>
          {!search && !tagFilter && (
            <button
              onClick={onAddRecipe}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add your first recipe
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} onClick={() => onRecipeClick(recipe)} />
          ))}
        </div>
      )}

      {/* Active filter indicator */}
      {tagFilter && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-900 text-white text-sm shadow-xl">
          <span>Filtering by: {tagFilter}</span>
          <button onClick={() => setTagFilter(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
