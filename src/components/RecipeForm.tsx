import { useState } from 'react';
import { ArrowLeft, Plus, X, Loader2 } from 'lucide-react';
import type { Recipe } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

type Props = {
  recipe?: Recipe | null;
  onSaved: () => void;
  onCancel: () => void;
};

export default function RecipeForm({ recipe, onSaved, onCancel }: Props) {
  const isEdit = !!recipe;
  const [title, setTitle] = useState(recipe?.title ?? '');
  const [description, setDescription] = useState(recipe?.description ?? '');
  const [ingredients, setIngredients] = useState<string[]>(recipe?.ingredients ?? ['']);
  const [instructions, setInstructions] = useState<string[]>(recipe?.instructions ?? ['']);
  const [prepTime, setPrepTime] = useState(recipe?.prep_time_minutes?.toString() ?? '');
  const [cookTime, setCookTime] = useState(recipe?.cook_time_minutes?.toString() ?? '');
  const [servings, setServings] = useState(recipe?.servings?.toString() ?? '');
  const [imageUrl, setImageUrl] = useState(recipe?.image_url ?? '');
  const [tags, setTags] = useState<string[]>(recipe?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      ingredients: ingredients.filter((i) => i.trim()),
      instructions: instructions.filter((i) => i.trim()),
      prep_time_minutes: prepTime ? parseInt(prepTime) : 0,
      cook_time_minutes: cookTime ? parseInt(cookTime) : 0,
      servings: servings ? parseInt(servings) : 1,
      image_url: imageUrl.trim(),
      tags,
    };

    let result;
    if (isEdit && recipe) {
      result = await supabase.from('recipes').update(payload).eq('id', recipe.id);
    } else {
      result = await supabase.from('recipes').insert(payload).select('*').single();
    }

    setSaving(false);
    if (result.error) {
      setError(result.error.message);
    } else {
      onSaved();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onCancel}
        className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Cancel
      </button>

      <h1 className="text-2xl font-bold text-stone-900 mb-6 tracking-tight">
        {isEdit ? 'Edit Recipe' : 'New Recipe'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
            placeholder="Grandma's Apple Pie"
          />
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Image URL</label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
            placeholder="https://..."
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all resize-none"
            placeholder="A short description of this recipe..."
          />
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Prep (min)</label>
            <input
              type="number"
              min="0"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Cook (min)</label>
            <input
              type="number"
              min="0"
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Servings</label>
            <input
              type="number"
              min="1"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Tags</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              className="flex-1 px-4 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
              placeholder="dessert, quick, vegan..."
            />
            <button
              type="button"
              onClick={addTag}
              className="px-3 py-2 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-100"
                >
                  {tag}
                  <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Ingredients */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Ingredients</label>
          <div className="space-y-2">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={ing}
                  onChange={(e) => {
                    const next = [...ingredients];
                    next[i] = e.target.value;
                    setIngredients(next);
                  }}
                  className="flex-1 px-4 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all text-sm"
                  placeholder={`Ingredient ${i + 1}`}
                />
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setIngredients(ingredients.filter((_, idx) => idx !== i))}
                    className="px-3 rounded-xl bg-stone-100 text-stone-400 hover:bg-red-50 hover:text-red-600 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setIngredients([...ingredients, ''])}
            className="mt-2 flex items-center gap-1.5 text-sm text-amber-600 font-medium hover:text-amber-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add ingredient
          </button>
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Instructions</label>
          <div className="space-y-2">
            {instructions.map((step, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="shrink-0 mt-2 w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <textarea
                  value={step}
                  onChange={(e) => {
                    const next = [...instructions];
                    next[i] = e.target.value;
                    setInstructions(next);
                  }}
                  rows={1}
                  className="flex-1 px-4 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all text-sm resize-none"
                  placeholder={`Step ${i + 1}`}
                />
                {instructions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setInstructions(instructions.filter((_, idx) => idx !== i))}
                    className="mt-1 px-3 rounded-xl bg-stone-100 text-stone-400 hover:bg-red-50 hover:text-red-600 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setInstructions([...instructions, ''])}
            className="mt-2 flex items-center gap-1.5 text-sm text-amber-600 font-medium hover:text-amber-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add step
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 text-sm font-medium transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-medium text-sm hover:bg-amber-700 active:scale-95 transition-all disabled:opacity-60 flex items-center gap-2 shadow-lg shadow-amber-600/20"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Recipe'}
          </button>
        </div>
      </form>
    </div>
  );
}
