'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Trash2, UserCheck } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadUsers = async () => {
    setLoading(true);
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (search.trim()) {
      query = query.ilike('username', `%${search.trim()}%`);
    }

    const { data, error } = await query;
    if (error) console.error(error);
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, [search]);

  const changeRole = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (!error) loadUsers();
  };

  const deleteUser = async (userId: string, username: string) => {
    if (!confirm(`Удалить пользователя ${username} и все его данные?`)) return;

    // Удаляем связанные данные
    await supabase.from('posts').delete().eq('user_id', userId);
    await supabase.from('reviews').delete().eq('user_id', userId);
    await supabase.from('threads').delete().eq('user_id', userId);
    await supabase.from('comments').delete().eq('user_id', userId);
    await supabase.from('votes').delete().eq('user_id', userId);
    await supabase.from('user_ratings').delete().eq('user_id', userId);
    await supabase.from('subscriptions').delete().or(`follower_id.eq.${userId},following_id.eq.${userId}`);

    // Удаляем профиль
    const { error } = await supabase.from('profiles').delete().eq('id', userId);

    if (!error) loadUsers();
  };

  return (
    <div className="bg-[#121216] rounded-3xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl text-[#d9d9d9] font-semibold">Управление пользователями</h2>
        <div className="text-sm text-gray-400">{users.length} пользователей</div>
      </div>

      <input
        type="text"
        placeholder="Поиск по username или email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-[#09090b] text-[#d9d9d9] rounded-2xl px-5 py-3 mb-6 focus:outline-none focus:border-violet-500"
      />

      <div className="max-h-[620px] overflow-auto space-y-3 pr-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center text-[#d9d9d9] justify-between bg-[#09090b] hover:bg-purple-950 p-5 rounded-2xl group"
          >
            <div className="flex items-center gap-4">
              {user.avatar_url && (
                <img
                  src={user.avatar_url}
                  alt={user.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div>
                <p className="font-medium">{user.username}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
                <select
                    value={user.role || 'user'}
                    onChange={(e) => changeRole(user.id, e.target.value)}
                    className="bg-[#121216] rounded-xl px-4 py-2 text-sm focus:outline-none"
                    >
                    <option value="user">Пользователь</option>
                    <option value="admin">Администратор</option>
                </select>

              <button
                onClick={() => deleteUser(user.id, user.username)}
                className="p-3 text-red-400 hover:bg-red-950 hover:text-red-500 rounded-xl transition opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}

        {users.length === 0 && !loading && (
          <p className="text-center text-gray-500 py-10">Пользователи не найдены</p>
        )}
      </div>
    </div>
  );
}