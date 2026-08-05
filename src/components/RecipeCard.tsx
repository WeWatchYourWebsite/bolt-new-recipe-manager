import { Clock, Users, ChefHat } from 'lucide-react';
import type { Recipe } from '@/lib/supabase';

type Props = {
  recipe: Recipe;
  onClick: () => void;
};

export default function RecipeCard({ recipe, onClick }: Props) {
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  return (
    <button
      onClick={onClick}
      className="group text-left bg-white rounded-2xl border border-stone-100 overflow-hidden hover:shadow-xl hover:shadow-stone-200/50 hover:border-amber-200 transition-all duration-300 hover:-translate-y-0.5"
    >
      {/* Image */}
      <div className="h-44 bg-stone-100 overflow-hidden relative">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-stone-100">
            <ChefHat className="w-12 h-12 text-stone-300" strokeWidth={1.5} />
          </div>
        )}
        {recipe.tags.length > 0 && (
          <div className="absolute bottom-2 left-2 flex gap-1.5 flex-wrap">
            {recipe.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md bg-white/90 backdrop-blur text-xs font-medium text-stone-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-stone-900 text-base leading-snug mb-1 line-clamp-1">
          {recipe.title}
        </h3>
        <p className="text-sm text-stone-500 line-clamp-2 mb-3 min-h-[2.5rem]">
          {recipe.description || 'No description'}
        </p>
        <div className="flex items-center gap-4 text-xs text-stone-400">
          {totalTime > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {totalTime} min
            </span>
          )}
          {recipe.servings > 0 && (
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {recipe.servings} servings
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
