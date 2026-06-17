'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';

export function ThreadsTab({ 
  contentId, 
  episodeId 
}: { 
  contentId: number; 
  episodeId?: number | null;
}) {
  const [threads, setThreads] = useState<any[]>([]);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const { user } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    fetchThreads();
  }, [contentId, episodeId]);

  const fetchThreads = async () => {
    setLoading(true);
    let query = supabase
      .from('threads')
      .select(`
        *,
        profiles!threads_user_id_fkey (username, avatar_url)
      `)
      .eq('content_id', contentId)
      .order('created_at', { ascending: false });

    if (episodeId) {
      query = query.eq('episode_id', episodeId);
    }

    const { data } = await query;
    setThreads(data || []);
    setLoading(false);
  };

  const createThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newThreadTitle.trim() || !newThreadContent.trim()) return;

    setSubmitting(true);

    const { error } = await supabase
      .from('threads')
      .insert({
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
      alert('Ошибка при создании треда');
    }

    setSubmitting(false);
  };

  return (
    <div className="space-y-10">
      {/* Форма создания треда */}
      {user && (
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
              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-3 text-[#d9d9d9]"
              required
            />
            <textarea
              placeholder="Текст треда..."
              value={newThreadContent}
              onChange={(e) => setNewThreadContent(e.target.value)}
              rows={4}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 text-[#d9d9d9] resize-y min-h-[120px]"
              required
            />
            <button
              type="submit"
              disabled={submitting || !newThreadTitle.trim() || !newThreadContent.trim()}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-700 rounded-2xl font-medium text-white cursor-pointer transition"
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
          <p className="text-zinc-500 py-10 text-center">
            {episodeId ? 'Пока нет тредов под этой серией.' : 'Пока нет тредов. Создайте первый!'}
          </p>
        ) : (
          threads.map((thread) => (
            <Link 
              key={thread.id} 
              href={`/threads/${thread.id}`}
              className="block bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:border-purple-500 transition"
            >
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={thread.profiles?.avatar_url || '/default-avatar.png'}
                  alt=""
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-semibold text-[#d9d9d9]">@{thread.profiles?.username}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(thread.created_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-white mb-2">{thread.title}</h3>
              <p className="text-zinc-400 line-clamp-3">{thread.content}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}