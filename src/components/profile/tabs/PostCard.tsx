'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { CommentTree, CommentWithUser } from '@/components/social/CommentTree';
import { CommentForm } from '@/components/social/CommentForm';
import { createClient } from '@/lib/supabase/client';

interface PostCardProps {
  post: {
    id: number;
    user_id: string;
    title?: string;
    body: string;
    content?: string;
    likes_count?: number;
    comments_count?: number;
    created_at: string;
    profiles?: {
      username: string;
      avatar_url: string | null;
    };
  };
}

export default function PostCard({ post }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const supabase = createClient();

  const loadComments = async () => {
    const newShowState = !showComments;
    setShowComments(newShowState);

    if (!newShowState) return;

    setLoadingComments(true);

    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles!comments_user_id_fkey (username, avatar_url),
        votes (value)
      `)
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Ошибка загрузки комментариев:', error);
    } else {
      setComments((data as CommentWithUser[]) || []);
    }

    setLoadingComments(false);
  };

  const refetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles!comments_user_id_fkey (username, avatar_url),
        votes (value)
      `)
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Ошибка обновления комментариев:', error);
    } else {
      setComments((data as CommentWithUser[]) || []);
    }
  };

  return (
    <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 mb-6">
      {/* Пост */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-zinc-700 flex-shrink-0 overflow-hidden">
          {post.profiles?.avatar_url ? (
            <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-400 font-medium">
              {post.profiles?.username?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold">@{post.profiles?.username || 'Пользователь'}</span>
            <span className="text-zinc-500 text-sm">
              {new Date(post.created_at).toLocaleDateString('ru-RU')}
            </span>
          </div>

          {post.title && <h3 className="font-semibold mt-2 text-lg">{post.title}</h3>}
          <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-wrap">
            {post.body || post.content}
          </p>
        </div>
      </div>

      {/* Кнопка комментариев */}
      <button
        onClick={loadComments}
        className="mt-5 w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-medium flex items-center justify-center gap-2 border border-zinc-700 hover:text-purple-400 transition-colors"
      >
        <MessageCircle className="w-5 h-5" />
        Комментарии ({post.comments_count ?? comments.length})
      </button>

      {/* Блок комментариев */}
      {showComments && (
        <div className="mt-6 pt-6 border-t border-zinc-800">
          {loadingComments ? (
            <div className="py-8 text-center text-zinc-500">Загрузка...</div>
          ) : (
            <>
              <CommentTree
                comments={comments}
                postId={post.id}
                onCommentAdded={refetchComments}
              />

              {/* Форма — только ОДНА */}
              <div className="mt-8 pt-4 border-t border-zinc-800">
                <CommentForm postId={post.id} onSuccess={refetchComments} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}