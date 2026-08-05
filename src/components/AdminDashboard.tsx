import { useEffect, useState } from 'react';
import { Users, ChefHat, Shield, ShieldOff, Loader2 } from 'lucide-react';
import { supabase, type Profile } from '@/lib/supabase';

export default function AdminDashboard() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, recipes: 0, collections: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('recipes').select('id', { count: 'exact', head: true }),
      supabase.from('collections').select('id', { count: 'exact', head: true }),
    ]).then(([profileRes, recipeRes, colRes]) => {
      if (profileRes.data) setProfiles(profileRes.data as Profile[]);
      setStats({
        users: profileRes.data?.length ?? 0,
        recipes: recipeRes.count ?? 0,
        collections: colRes.count ?? 0,
      });
      setLoading(false);
    });
  }, []);

  const toggleAdmin = async (id: string, currentVal: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_admin: !currentVal }).eq('id', id);
    if (!error) {
      setProfiles(profiles.map((p) => (p.id === id ? { ...p, is_admin: !currentVal } : p)));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-stone-300" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-stone-900 tracking-tight mb-2">Admin Dashboard</h2>
      <p className="text-sm text-stone-500 mb-8">Manage users and view platform statistics</p>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-sky-600" />
            </div>
            <span className="text-sm text-stone-500">Total Users</span>
          </div>
          <p className="text-3xl font-bold text-stone-900">{stats.users}</p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm text-stone-500">Total Recipes</span>
          </div>
          <p className="text-3xl font-bold text-stone-900">{stats.recipes}</p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-sm text-stone-500">Total Collections</span>
          </div>
          <p className="text-3xl font-bold text-stone-900">{stats.collections}</p>
        </div>
      </div>

      {/* User table */}
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100">
          <h3 className="font-semibold text-stone-900">Users</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-5 py-3">Email</th>
                <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-5 py-3">Joined</th>
                <th className="text-left text-xs font-medium text-stone-500 uppercase tracking-wider px-5 py-3">Role</th>
                <th className="text-right text-xs font-medium text-stone-500 uppercase tracking-wider px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-sm text-stone-900 font-medium">{p.email ?? 'Unknown'}</td>
                  <td className="px-5 py-3.5 text-sm text-stone-500">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5">
                    {p.is_admin ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-100">
                        <Shield className="w-3 h-3" />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 text-xs font-medium">
                        User
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => toggleAdmin(p.id, p.is_admin)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        p.is_admin
                          ? 'text-stone-600 hover:bg-stone-100'
                          : 'text-amber-600 hover:bg-amber-50'
                      }`}
                    >
                      {p.is_admin ? (
                        <>
                          <ShieldOff className="w-3.5 h-3.5" />
                          Remove Admin
                        </>
                      ) : (
                        <>
                          <Shield className="w-3.5 h-3.5" />
                          Make Admin
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
