'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface Thread {
  id: number;
  title: string;
  content: string;
  likes_count: number;
  created_at: string;
  user_id: string;
  profiles: {
    id: string;           // ← обязательно для ссылки
    username: string;
    avatar_url: string | null;
  } | null;
  content_id?: number;
  episode_id?: number | null;
}

interface ThreadsTabProps {
  userId?: string;
  contentId?: number;
  episodeId?: number | null;
  isProfileTab?: boolean;
}

export function ThreadsTab({
  userId,
  contentId,
  episodeId = null,
  isProfileTab = false,
}: ThreadsTabProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const { user } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    fetchThreads();
  }, [userId, contentId, episodeId]);

  const fetchThreads = async () => {
    setLoading(true);

    let query = supabase
      .from('threads')
      .select(`
        *,
        profiles!threads_user_id_fkey (id, username, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (isProfileTab && userId) {
      query = query.eq('user_id', userId);
    } else if (contentId) {
      query = query.eq('content_id', contentId);

      if (episodeId != null) {
        query = query.eq('episode_id', episodeId);
      } else {
        query = query.filter('episode_id', 'is', null);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Ошибка загрузки тредов:', error);
      setThreads([]);
    } else {
      setThreads(data || []);
    }

    setLoading(false);
  };

  const createThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newThreadTitle.trim() || !newThreadContent.trim() || !contentId) return;

    setSubmitting(true);

    const { error } = await supabase.from('threads').insert({
      content_id: contentId,
      episode_id: episodeId ?? null,
      user_id: user.id,
      title: newThreadTitle.trim(),
      content: newThreadContent.trim(),
    });

    if (!error) {
      setNewThreadTitle('');
      setNewThreadContent('');
      await fetchThreads();
    } else {
      console.error('Ошибка создания треда:', error);
      alert('Ошибка при создании треда');
    }

    setSubmitting(false);
  };

  return (
    <div className="space-y-10">
      {/* Форма создания */}
      {user && contentId && !isProfileTab && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <h3 className="text-xl font-semibold text-[#d9d9d9] mb-4">
            {episodeId ? 'Создать тред под серией' : 'Создать тред к контенту'}
          </h3>
          <form onSubmit={createThread} className="space-y-4">
            <input
              type="text"
              placeholder="Заголовок треда"
              value={newThreadTitle}
              onChange={(e) => setNewThreadTitle(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-3 text-[#d9d9d9] focus:outline-none focus:border-purple-500"
              required
            />
            <textarea
              placeholder="Текст треда..."
              value={newThreadContent}
              onChange={(e) => setNewThreadContent(e.target.value)}
              rows={4}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 text-[#d9d9d9] resize-y min-h-[120px] focus:outline-none focus:border-purple-500"
              required
            />
            <button
              type="submit"
              disabled={submitting || !newThreadTitle.trim() || !newThreadContent.trim()}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-700 rounded-2xl font-medium text-white transition"
            >
              {submitting ? 'Создание...' : 'Создать тред'}
            </button>
          </form>
        </div>
      )}

      {/* Список тредов */}
      <div className="space-y-6">
        {loading ? (
          <p className="text-zinc-500 py-10 text-center">Загрузка тредов...</p>
        ) : threads.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 bg-zinc-900 rounded-3xl">
            {isProfileTab
              ? 'У пользователя пока нет тредов'
              : 'Пока нет тредов. Будьте первым!'}
          </div>
        ) : (
          threads.map((thread) => {
            const profile = thread.profiles;

            return (
              <div
                key={thread.id}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:border-purple-500 transition-all"
              >
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={profile?.avatar_url || '/default-avatar.png'}
                    alt={profile?.username || ''}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <Link
                      href={`/profile/${profile?.id}`}   // ← Теперь точно по id
                      className="font-semibold text-[#d9d9d9] hover:text-purple-400"
                    >
                      @{profile?.username}
                    </Link>
                    <p className="text-xs text-zinc-500">
                      {new Date(thread.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>

                <Link href={`/threads/${thread.id}`} className="block group">
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-400 transition">
                    {thread.title}
                  </h3>
                  <p className="text-zinc-400 line-clamp-3">{thread.content}</p>
                </Link>

                <div className="flex items-center justify-end pt-4 mt-4 border-t border-zinc-800">
                  <Link
                    href={`/threads/${thread.id}`}
                    className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 rounded-2xl text-white text-sm font-medium transition"
                  >
                    Перейти в тред <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}