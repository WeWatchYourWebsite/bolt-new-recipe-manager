import { useState } from 'react';
import { Plus, X, Trash2, FolderOpen, Loader2 } from 'lucide-react';
import type { Collection, Recipe } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import RecipeCard from './RecipeCard';

type Props = {
  collections: Collection[];
  recipes: Recipe[];
  onCollectionClick: (collection: Collection) => void;
  onRecipeClick: (recipe: Recipe) => void;
  onRefresh: () => void;
};

const COLORS = [
  { name: 'amber', class: 'bg-amber-500' },
  { name: 'rose', class: 'bg-rose-500' },
  { name: 'emerald', class: 'bg-emerald-500' },
  { name: 'sky', class: 'bg-sky-500' },
  { name: 'violet', class: 'bg-violet-500' },
  { name: 'orange', class: 'bg-orange-500' },
];

export default function CollectionsView({
  collections,
  recipes,
  onCollectionClick,
  onRecipeClick,
  onRefresh,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('amber');
  const [saving, setSaving] = useState(false);
  const [activeCollection, setActiveCollection] = useState<Collection | null>(null);
  const [collectionRecipes, setCollectionRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const createCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from('collections')
      .insert({ name: name.trim(), description: description.trim(), color });
    setSaving(false);
    if (!error) {
      setShowForm(false);
      setName('');
      setDescription('');
      setColor('amber');
      onRefresh();
    }
  };

  const openCollection = async (col: Collection) => {
    setActiveCollection(col);
    setLoadingRecipes(true);
    const { data } = await supabase
      .from('recipe_collections')
      .select('recipe_id')
      .eq('collection_id', col.id);
    if (data) {
      const ids = data.map((d) => d.recipe_id as string);
      const colRecipes = recipes.filter((r) => ids.includes(r.id));
      setCollectionRecipes(colRecipes);
    }
    setLoadingRecipes(false);
  };

  const deleteCollection = async (id: string) => {
    await supabase.from('collections').delete().eq('id', id);
    setConfirmDelete(null);
    setActiveCollection(null);
    onRefresh();
  };

  if (activeCollection) {
    return (
      <div>
        <button
          onClick={() => setActiveCollection(null)}
          className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 mb-6 transition-colors"
        >
          <X className="w-4 h-4" />
          Back to collections
        </button>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className={`w-3 h-3 rounded-full ${COLORS.find((c) => c.name === activeCollection.color)?.class ?? 'bg-amber-500'}`} />
              <h2 className="text-2xl font-bold text-stone-900 tracking-tight">{activeCollection.name}</h2>
            </div>
            {activeCollection.description && (
              <p className="text-sm text-stone-500">{activeCollection.description}</p>
            )}
          </div>
          <button
            onClick={() => setConfirmDelete(activeCollection.id)}
            className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {loadingRecipes ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-stone-300" />
          </div>
        ) : collectionRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
              <FolderOpen className="w-7 h-7 text-stone-300" />
            </div>
            <p className="text-stone-400">No recipes in this collection yet</p>
            <p className="text-sm text-stone-400 mt-1">Open a recipe and add it to this collection</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {collectionRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} onClick={() => onRecipeClick(recipe)} />
            ))}
          </div>
        )}

        {confirmDelete && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={() => setConfirmDelete(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-stone-900 mb-2">Delete collection?</h3>
              <p className="text-sm text-stone-500 mb-6">
                This will remove the collection. Your recipes will not be deleted.
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-sm font-medium transition-all">
                  Cancel
                </button>
                <button onClick={() => deleteCollection(confirmDelete)} className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 text-sm font-medium transition-all">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Collections</h2>
          <p className="text-sm text-stone-500 mt-0.5">
            {collections.length} {collections.length === 1 ? 'collection' : 'collections'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 text-white font-medium text-sm hover:bg-amber-700 active:scale-95 transition-all shadow-lg shadow-amber-600/20"
        >
          <Plus className="w-4 h-4" />
          New Collection
        </button>
      </div>

      {collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
            <FolderOpen className="w-7 h-7 text-stone-300" />
          </div>
          <p className="text-stone-400 mb-1">No collections yet</p>
          <p className="text-sm text-stone-400 mb-4">Organize your recipes into themed collections</p>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create a collection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((col) => (
            <button
              key={col.id}
              onClick={() => openCollection(col)}
              className="group text-left bg-white rounded-2xl border border-stone-100 p-5 hover:shadow-xl hover:shadow-stone-200/50 hover:border-amber-200 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className={`w-10 h-10 rounded-xl ${COLORS.find((c) => c.name === col.color)?.class ?? 'bg-amber-500'} flex items-center justify-center`}>
                  <FolderOpen className="w-5 h-5 text-white" />
                </span>
                <div>
                  <h3 className="font-semibold text-stone-900 group-hover:text-amber-700 transition-colors">{col.name}</h3>
                  <p className="text-xs text-stone-400">
                    {new Date(col.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {col.description && <p className="text-sm text-stone-500 line-clamp-2">{col.description}</p>}
            </button>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-stone-900 mb-4">New Collection</h3>
            <form onSubmit={createCollection} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  placeholder="Weeknight Dinners"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                  placeholder="Quick meals for busy nights"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Color</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setColor(c.name)}
                      className={`w-9 h-9 rounded-xl ${c.class} transition-all ${
                        color === c.name ? 'ring-2 ring-offset-2 ring-stone-900 scale-110' : 'hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-sm font-medium transition-all">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-amber-600 text-white font-medium text-sm hover:bg-amber-700 transition-all disabled:opacity-60 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
