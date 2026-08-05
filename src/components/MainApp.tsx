import { useState } from 'react';
import {
  ChefHat,
  BookOpen,
  FolderOpen,
  Shield,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRecipes, useCollections } from '@/hooks/useRecipeData';
import type { Recipe, Collection } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import RecipeGrid from './RecipeGrid';
import RecipeDetail from './RecipeDetail';
import RecipeForm from './RecipeForm';
import CollectionsView from './CollectionsView';
import AdminDashboard from './AdminDashboard';

type View = 'recipes' | 'collections' | 'admin';

export default function MainApp() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { recipes, loading: recipesLoading, refresh: refreshRecipes } = useRecipes();
  const { collections, loading: collectionsLoading, refresh: refreshCollections } = useCollections();

  const [view, setView] = useState<View>('recipes');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setEditingRecipe(null);
    setShowForm(false);
  };

  const handleAddRecipe = () => {
    setEditingRecipe(null);
    setShowForm(true);
    setSelectedRecipe(null);
  };

  const handleEditRecipe = () => {
    if (selectedRecipe) {
      setEditingRecipe(selectedRecipe);
      setShowForm(true);
    }
  };

  const handleDeleteRecipe = async () => {
    if (!selectedRecipe) return;
    await supabase.from('recipes').delete().eq('id', selectedRecipe.id);
    await refreshRecipes();
    setSelectedRecipe(null);
  };

  const handleFormSaved = async () => {
    await refreshRecipes();
    setShowForm(false);
    setEditingRecipe(null);
    setSelectedRecipe(null);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const navItems = [
    { id: 'recipes' as View, label: 'Recipes', icon: BookOpen },
    { id: 'collections' as View, label: 'Collections', icon: FolderOpen },
    ...(isAdmin ? [{ id: 'admin' as View, label: 'Admin', icon: Shield }] : []),
  ];

  // Recipe Form view
  if (showForm) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <RecipeForm
            recipe={editingRecipe}
            onSaved={handleFormSaved}
            onCancel={() => {
              setShowForm(false);
              setEditingRecipe(null);
            }}
          />
        </div>
      </div>
    );
  }

  // Recipe Detail view
  if (selectedRecipe) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <RecipeDetail
            recipe={selectedRecipe}
            collections={collections}
            onBack={() => setSelectedRecipe(null)}
            onEdit={handleEditRecipe}
            onDelete={handleDeleteRecipe}
            onCollectionToggle={() => refreshCollections()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-stone-100 flex-col fixed h-screen">
        <SidebarContent
          view={view}
          setView={(v) => {
            setView(v);
            setSelectedRecipe(null);
          }}
          navItems={navItems}
          user={user}
          profile={profile}
          isAdmin={isAdmin}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* Sidebar - Mobile */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white border-r border-stone-100 flex flex-col">
            <SidebarContent
              view={view}
              setView={(v) => {
                setView(v);
                setSelectedRecipe(null);
                setSidebarOpen(false);
              }}
              navItems={navItems}
              user={user}
              profile={profile}
              isAdmin={isAdmin}
              onSignOut={handleSignOut}
            />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-stone-100 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-stone-100 transition-colors">
            <Menu className="w-5 h-5 text-stone-700" />
          </button>
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-amber-600" />
            <span className="font-bold text-stone-900">Mise</span>
          </div>
          <div className="w-9" />
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto">
          {view === 'recipes' && (
            <RecipeGrid
              recipes={recipes}
              loading={recipesLoading}
              onRecipeClick={handleRecipeClick}
              onAddRecipe={handleAddRecipe}
            />
          )}
          {view === 'collections' && (
            <CollectionsView
              collections={collections}
              recipes={recipes}
              onCollectionClick={() => {}}
              onRecipeClick={handleRecipeClick}
              onRefresh={refreshCollections}
            />
          )}
          {view === 'admin' && isAdmin && <AdminDashboard />}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  view,
  setView,
  navItems,
  user,
  profile,
  isAdmin,
  onSignOut,
}: {
  view: View;
  setView: (v: View) => void;
  navItems: { id: View; label: string; icon: typeof BookOpen }[];
  user: { email?: string } | null;
  profile: { email?: string; is_admin?: boolean } | null;
  isAdmin: boolean;
  onSignOut: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="px-6 py-6 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center shadow-lg shadow-amber-600/20">
            <ChefHat className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <span className="font-bold text-stone-900 text-lg tracking-tight">Mise</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-amber-50 text-amber-700'
                  : 'text-stone-600 hover:bg-stone-50'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 ${active ? 'text-amber-600' : 'text-stone-400'}`} />
              {item.label}
              {item.id === 'admin' && (
                <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wide">
                  Admin
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-stone-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center text-sm font-semibold text-stone-600 uppercase">
            {(profile?.email ?? user?.email ?? '?')[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-900 truncate">
              {profile?.email ?? user?.email}
            </p>
            <p className="text-xs text-stone-400">
              {isAdmin ? 'Administrator' : 'Member'}
            </p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50 transition-all"
        >
          <LogOut className="w-4.5 h-4.5 text-stone-400" />
          Sign Out
        </button>
      </div>
    </>
  );
}
