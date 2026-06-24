'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Trash2 } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const supabase = createClient();

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, [search]);

  const deleteUser = async (userId: string, username: string) => {
    if (!confirm(`Удалить пользователя ${username} и ВСЕ его данные? Действие необратимо!`)) return;

    setDeletingId(userId);

    try {
      console.log(`Начинаем удаление пользователя ${userId}`);

      // === 1. Удаляем все дочерние записи ===
      await supabase.from('votes').delete().eq('user_id', userId);
      await supabase.from('comments').delete().eq('user_id', userId);
      await supabase.from('threads').delete().eq('user_id', userId);
      await supabase.from('reviews').delete().eq('user_id', userId);
      await supabase.from('posts').delete().eq('user_id', userId);
      await supabase.from('user_ratings').delete().eq('user_id', userId);
      
      await supabase
        .from('subscriptions')
        .delete()
        .or(`follower_id.eq.${userId},following_id.eq.${userId}`);

      // === 2. Удаляем профиль ===
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('Ошибка удаления профиля:', profileError);
        throw profileError;
      }

      alert(`✅ Пользователь ${username} успешно удалён`);
      await loadUsers();

    } catch (error: any) {
      console.error('Ошибка удаления:', error);
      alert(`❌ Не удалось удалить пользователя:\n${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const changeRole = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) alert('Ошибка смены роли');
    else loadUsers();
  };

  return (
    <div className="bg-[#121216] rounded-3xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl text-[#d9d9d9] font-semibold">Управление пользователями</h2>
        <div className="text-sm text-gray-400">{users.length} пользователей</div>
      </div>

      <input
        type="text"
        placeholder="Поиск по username..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-[#09090b] text-[#d9d9d9] rounded-2xl px-5 py-3 mb-6 focus:outline-none focus:border-violet-500"
      />

      <div className="max-h-[620px] overflow-auto space-y-3 pr-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between bg-[#09090b] hover:bg-purple-950 p-5 rounded-2xl group"
          >
            <div className="flex items-center gap-4">
              {user.avatar_url && <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full" />}
              <div>
                <p className="font-medium">{user.username}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={user.role || 'user'}
                onChange={(e) => changeRole(user.id, e.target.value)}
                className="bg-[#121216] rounded-xl px-4 py-2 text-sm"
              >
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>

              <button
                onClick={() => deleteUser(user.id, user.username)}
                disabled={deletingId === user.id}
                className="p-3 text-red-400 hover:bg-red-950 rounded-xl transition disabled:opacity-50"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}