'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';
import { Heart, ArrowRight, UserPlus, UserCheck } from 'lucide-react';

interface Thread {
  id: number;
  title: string;
  content: string;
  likes_count: number;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  } | null;
  content_id?: number;
  episode_id?: number | null;
}

interface ThreadsTabProps {
  userId?: string;           // Для таба в профиле пользователя
  contentId?: number;        // Для страницы фильма/сериала
  episodeId?: number | null; // Для конкретной серии
  isProfileTab?: boolean;
}

export function ThreadsTab({
  userId,
  contentId,
  episodeId,
  isProfileTab = false,
}: ThreadsTabProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [subscribed, setSubscribed] = useState<Set<string>>(new Set());

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
        profiles!threads_user_id_fkey (username, avatar_url)
      `)
      .order('created_at', { ascending: false });

    // Фильтрация в зависимости от режима
    if (isProfileTab && userId) {
      query = query.eq('user_id', userId);
    } else if (contentId) {
      query = query.eq('content_id', contentId);
      if (episodeId !== undefined) {
        query = query.eq('episode_id', episodeId);
      }
    }

    const { data, error } = await query;
    if (error) console.error('Ошибка загрузки тредов:', error);

    setThreads(data || []);
    setLoading(false);
  };

  const toggleLike = async (threadId: number) => {
    if (!user) {
      alert('Войдите, чтобы ставить лайки');
      return;
    }

    const isCurrentlyLiked = liked.has(threadId);

    if (isCurrentlyLiked) {
      await supabase
        .from('votes')
        .delete()
        .eq('user_id', user.id)
        .eq('thread_id', threadId);
      setLiked((prev) => {
        const n = new Set(prev);
        n.delete(threadId);
        return n;
      });
    } else {
      await supabase.from('votes').insert({
        user_id: user.id,
        thread_id: threadId,
        value: 1,
      });
      setLiked((prev) => new Set(prev).add(threadId));
    }

    // Обновляем счётчики
    fetchThreads();
  };

  const toggleSubscribe = async (followingId: string) => {
    if (!user || followingId === user.id) return;

    const isSubscribedNow = subscribed.has(followingId);

    if (isSubscribedNow) {
      await supabase
        .from('subscriptions')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', followingId);
      setSubscribed((prev) => {
        const n = new Set(prev);
        n.delete(followingId);
        return n;
      });
    } else {
      await supabase.from('subscriptions').insert({
        follower_id: user.id,
        following_id: followingId,
      });
      setSubscribed((prev) => new Set(prev).add(followingId));
    }
  };

  const createThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newThreadTitle.trim() || !newThreadContent.trim() || !contentId) return;

    setSubmitting(true);

    const { error } = await supabase.from('threads').insert({
      content_id: contentId,
      episode_id: episodeId || null,
      user_id: user.id,
      title: newThreadTitle.trim(),
      content: newThreadContent.trim(),
    });

    if (!error) {
      setNewThreadTitle('');
      setNewThreadContent('');
      fetchThreads();
    } else {
      console.error(error);
      alert('Ошибка при создании треда');
    }

    setSubmitting(false);
  };

  return (
    <div className="space-y-10">
      {/* Форма создания треда (только на странице контента) */}
      {user && contentId && !isProfileTab && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <h3 className="text-xl font-semibold text-[#d9d9d9] mb-4">
            {episodeId ? 'Создать тред под серией' : 'Создать тред'}
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
              : 'Пока нет тредов. Создайте первый!'}
          </div>
        ) : (
          threads.map((thread) => {
            const profile = thread.profiles;
            const isLiked = liked.has(thread.id);
            const isSubscribed = subscribed.has(thread.user_id);

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
                      href={`/profile/${profile?.username}`}
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

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-800">
                  {/* <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleLike(thread.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm transition ${
                        isLiked
                          ? 'text-purple-500'
                          : 'text-zinc-400 hover:text-purple-400'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                      {(thread.likes_count || 0) + (isLiked ? 1 : 0)}
                    </button>

                    {user && user.id !== thread.user_id && (
                      <button
                        onClick={() => toggleSubscribe(thread.user_id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm transition ${
                          isSubscribed
                            ? 'bg-zinc-700 text-zinc-300'
                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                      >
                        {isSubscribed ? (
                          <UserCheck className="w-4 h-4" />
                        ) : (
                          <UserPlus className="w-4 h-4" />
                        )}
                        {isSubscribed ? 'Подписан' : 'Подписаться'}
                      </button>
                    )}
                  </div> */}

                  <Link
                    href={`/threads/${thread.id}`}
                    className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 rounded-2xl text-white text-sm font-medium transition"
                  >
                    Перейти <ArrowRight className="w-4 h-4" />
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