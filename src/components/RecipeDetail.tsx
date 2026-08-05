import { useState } from 'react';
import {
  ArrowLeft,
  Clock,
  Users,
  ChefHat,
  Pencil,
  Trash2,
  Plus,
  StickyNote,
  X,
  Check,
  Bookmark,
} from 'lucide-react';
import type { Recipe, Collection } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { useNotes, useRecipeCollections } from '@/hooks/useRecipeData';

type Props = {
  recipe: Recipe;
  collections: Collection[];
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCollectionToggle: (collectionId: string) => void;
};

export default function RecipeDetail({
  recipe,
  collections,
  onBack,
  onEdit,
  onDelete,
  onCollectionToggle,
}: Props) {
  const { notes, loading: notesLoading, refresh: refreshNotes, setNotes } = useNotes(recipe.id);
  const { linkedCollectionIds, refresh: refreshLinks } = useRecipeCollections(recipe.id);
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showCollections, setShowCollections] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  const addNote = async () => {
    if (!newNote.trim()) return;
    const { data, error } = await supabase
      .from('notes')
      .insert({ recipe_id: recipe.id, content: newNote.trim() })
      .select('*')
      .single();
    if (!error && data) {
      setNotes([data, ...notes]);
      setNewNote('');
    }
  };

  const updateNote = async (id: string) => {
    if (!editContent.trim()) return;
    const { data, error } = await supabase
      .from('notes')
      .update({ content: editContent.trim() })
      .eq('id', id)
      .select('*')
      .single();
    if (!error && data) {
      setNotes(notes.map((n) => (n.id === id ? data : n)));
      setEditingNoteId(null);
    }
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (!error) setNotes(notes.filter((n) => n.id !== id));
  };

  const toggleCollection = async (collectionId: string) => {
    const isLinked = linkedCollectionIds.includes(collectionId);
    if (isLinked) {
      await supabase
        .from('recipe_collections')
        .delete()
        .eq('recipe_id', recipe.id)
        .eq('collection_id', collectionId);
    } else {
      await supabase
        .from('recipe_collections')
        .insert({ recipe_id: recipe.id, collection_id: collectionId });
    }
    await refreshLinks();
    onCollectionToggle(collectionId);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to recipes
      </button>

      {/* Hero */}
      <div className="rounded-3xl overflow-hidden mb-8 bg-stone-100 relative h-64 sm:h-80">
        {recipe.image_url ? (
          <img src={recipe.image_url} alt={recipe.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-stone-100">
            <ChefHat className="w-20 h-20 text-stone-300" strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* Title + Actions */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">{recipe.title}</h1>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setShowCollections(!showCollections)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 text-stone-700 text-sm font-medium hover:bg-stone-200 transition-all"
          >
            <Bookmark className="w-4 h-4" />
            Collections
          </button>
          <button
            onClick={onEdit}
            className="p-2 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 transition-all"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-5 text-sm text-stone-500 mb-6">
        {totalTime > 0 && (
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {totalTime} min total
            {recipe.prep_time_minutes > 0 && ` (prep ${recipe.prep_time_minutes})`}
            {recipe.cook_time_minutes > 0 && ` (cook ${recipe.cook_time_minutes})`}
          </span>
        )}
        {recipe.servings > 0 && (
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {recipe.servings} servings
          </span>
        )}
      </div>

      {/* Tags */}
      {recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {recipe.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-100"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Collections panel */}
      {showCollections && (
        <div className="mb-8 bg-stone-50 rounded-2xl border border-stone-100 p-5">
          <h3 className="text-sm font-semibold text-stone-700 mb-3">Add to collections</h3>
          {collections.length === 0 ? (
            <p className="text-sm text-stone-400">No collections yet. Create one from the sidebar.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {collections.map((col) => {
                const linked = linkedCollectionIds.includes(col.id);
                return (
                  <button
                    key={col.id}
                    onClick={() => toggleCollection(col.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      linked
                        ? 'bg-amber-600 text-white'
                        : 'bg-white text-stone-600 border border-stone-200 hover:border-amber-300'
                    }`}
                  >
                    {linked && <Check className="w-3.5 h-3.5 inline mr-1" />}
                    {col.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Description */}
      {recipe.description && (
        <p className="text-stone-600 leading-relaxed mb-8 text-base">{recipe.description}</p>
      )}

      {/* Two column: ingredients + instructions */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Ingredients */}
        <div>
          <h2 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-amber-600" />
            Ingredients
          </h2>
          {recipe.ingredients.length === 0 ? (
            <p className="text-sm text-stone-400">No ingredients listed</p>
          ) : (
            <ul className="space-y-2.5">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-stone-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                  {ing}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Instructions */}
        <div>
          <h2 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-amber-600" />
            Instructions
          </h2>
          {recipe.instructions.length === 0 ? (
            <p className="text-sm text-stone-400">No instructions listed</p>
          ) : (
            <ol className="space-y-4">
              {recipe.instructions.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-sm text-stone-600 leading-relaxed pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Private Notes */}
      <div className="border-t border-stone-100 pt-8">
        <h2 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
          <StickyNote className="w-4.5 h-4.5 text-amber-600" />
          Private Notes
        </h2>
        <p className="text-xs text-stone-400 mb-4">Only you can see these notes.</p>

        {/* Add note */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addNote()}
            placeholder="Add a private note..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all text-sm"
          />
          <button
            onClick={addNote}
            disabled={!newNote.trim()}
            className="px-4 py-2.5 rounded-xl bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Notes list */}
        {notesLoading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-12 bg-stone-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <p className="text-sm text-stone-400">No notes yet</p>
        ) : (
          <div className="space-y-2">
            {notes.map((note) => (
              <div
                key={note.id}
                className="group flex items-start gap-3 bg-amber-50/50 border border-amber-100/50 rounded-xl px-4 py-3"
              >
                {editingNoteId === note.id ? (
                  <>
                    <input
                      type="text"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && updateNote(note.id)}
                      autoFocus
                      className="flex-1 px-2 py-1 rounded-lg border border-amber-200 bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                    <button onClick={() => updateNote(note.id)} className="text-green-600 hover:text-green-700 p-1">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingNoteId(null)} className="text-stone-400 hover:text-stone-600 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <p className="flex-1 text-sm text-stone-700">{note.content}</p>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingNoteId(note.id);
                          setEditContent(note.content);
                        }}
                        className="text-stone-400 hover:text-stone-700 p-1"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteNote(note.id)} className="text-stone-400 hover:text-red-600 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={() => setConfirmDelete(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-stone-900 mb-2">Delete recipe?</h3>
            <p className="text-sm text-stone-500 mb-6">
              This will permanently delete "{recipe.title}" and all its notes. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-sm font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={onDelete}
                className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 text-sm font-medium transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
