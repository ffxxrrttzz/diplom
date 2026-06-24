'use client';

import type { Database } from '@/types/database.types';
import { ThreadCommentTree } from './ThreadCommentTree';
import { ThreadCommentForm } from './ThreadCommentForm';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserPlus, UserCheck, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { createClient } from '@/lib/supabase/client';
import { AuthHeader } from '@/components/layout/AuthHeader';
import { GuestHeader } from '@/components/layout/GuestHeader';

type ThreadWithAuthor = Database['public']['Tables']['threads']['Row'] & {
  author: {
    id: string;
    username: string;
    avatar_url: string | null;
  } | null;
  content_info?: {
    id: number;
    title: string;
    type: string;
    poster_url?: string | null;
  } | null;
  episodes?: {
    id: number;
    episode_number: number;
    title?: string | null;
    season?: { season_number: number } | null;
  } | null;
};

type CommentWithUser = {
  id: number;
  content: string;
  created_at: string;
  parent_id: number | null;
  profiles: { username: string; avatar_url: string | null };
  votes: Array<{ value: number }>;
};

interface ThreadClientProps {
  thread: ThreadWithAuthor;
  initialComments: CommentWithUser[];
}

export function ThreadClient({ thread, initialComments }: ThreadClientProps) {
  const [comments, setComments] = useState<CommentWithUser[]>(initialComments);
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  const { user } = useAuthStore();
  const supabase = createClient();

  const isAuthor = user?.id === thread.user_id;

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user || isAuthor) return;
      const { data } = await supabase
        .from('subscriptions')
        .select('follower_id')
        .eq('follower_id', user.id)
        .eq('following_id', thread.user_id)
        .maybeSingle();
      setIsSubscribed(!!data);
    };
    checkSubscription();
  }, [user, thread.user_id, isAuthor, supabase]);

  const toggleSubscribe = async () => {
    if (!user || isAuthor) return;
    if (isSubscribed) {
      await supabase.from('subscriptions').delete()
        .eq('follower_id', user.id)
        .eq('following_id', thread.user_id);
      setIsSubscribed(false);
    } else {
      await supabase.from('subscriptions').insert({
        follower_id: user.id,
        following_id: thread.user_id,
      });
      setIsSubscribed(true);
    }
  };

  const handleNewComment = (newComment: CommentWithUser) => {
    setComments(prev => {
      if (newComment.parent_id) {
        const idx = prev.findIndex(c => c.id === newComment.parent_id);
        if (idx !== -1) {
          const copy = [...prev];
          copy.splice(idx + 1, 0, newComment);
          return copy;
        }
      }
      return [newComment, ...prev];
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-12">
      {user ? <AuthHeader /> : <GuestHeader />}

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Блок контента */}
        {thread.content_info && (
          <Link href={`/movie/${thread.content_info.id}`} className="flex gap-4 bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-8 hover:border-purple-500 group">
            {thread.content_info.poster_url && (
              <img src={thread.content_info.poster_url} alt="" className="w-16 h-24 object-cover rounded-xl" />
            )}
            <div>
              <p className="text-purple-400 text-sm">
                {thread.content_info.type === 'series' ? 'Сериал' : thread.content_info.type === 'anime' ? 'Аниме' : 'Фильм'}
              </p>
              <p className="text-xl font-semibold text-[#d9d9d9] group-hover:text-purple-400">
                {thread.content_info.title}
              </p>
              {thread.episodes && (
                <p className="text-zinc-400 text-sm">
                  Сезон {thread.episodes.season?.season_number} • Серия {thread.episodes.episode_number}
                </p>
              )}
            </div>
          </Link>
        )}

        {/* Автор треда */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-8">
          <div className="flex justify-between items-start">
            <Link href={`/profile/${thread.author?.id}`} className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-zinc-700">
                {thread.author?.avatar_url ? (
                  <img src={thread.author.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-700 flex items-center justify-center text-xl font-medium">
                    {thread.author?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div>
                <p className="text-lg font-semibold text-[#d9d9d9] group-hover:text-purple-400">
                  @{thread.author?.username}
                </p>
                <p className="text-sm text-zinc-500">
                  {new Date(thread.created_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </Link>

            {!isAuthor && user && (
              <button onClick={toggleSubscribe} className={`px-5 py-2.5 rounded-2xl flex items-center gap-2 ${isSubscribed ? 'bg-zinc-800 text-zinc-300' : 'bg-purple-600 text-white'}`}>
                {isSubscribed ? <UserCheck size={18} /> : <UserPlus size={18} />}
                {isSubscribed ? 'Подписан' : 'Подписаться'}
              </button>
            )}
          </div>

          <h1 className="text-3xl font-bold mt-8 mb-4">{thread.title}</h1>
          <p className="text-[17px] leading-relaxed text-[#d9d9d9] whitespace-pre-wrap">
            {thread.content}
          </p>
        </div>

        {/* Форма и комментарии */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-8">
          <ThreadCommentForm threadId={thread.id} onSuccess={handleNewComment} />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
          <h2 className="text-xl font-semibold mb-6">Комментарии ({comments.length})</h2>
          <ThreadCommentTree
            comments={comments}
            threadId={thread.id}
            onNewComment={handleNewComment}
            onCommentAdded={() => {}}
          />
        </div>
      </div>
    </div>
  );
}