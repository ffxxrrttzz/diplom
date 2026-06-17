'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Heart } from 'lucide-react';
import { CommentTree, CommentWithUser } from '@/components/social/CommentTree';
import { CommentForm } from '@/components/social/CommentForm';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface PostCardWrapperProps {
  post: any;
  isLiked: boolean;
  onLike: () => void;
}

export default function PostCardWrapper({ post, isLiked, onLike }: PostCardWrapperProps) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [localCommentsCount, setLocalCommentsCount] = useState<number>(post.comments_count || 0);

  const supabase = createClient();

  // ← НОВОЕ: Загружаем количество комментариев сразу при загрузке карточки
  useEffect(() => {
    const fetchCommentCount = async () => {
      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      if (error) {
        console.error('Ошибка получения количества комментариев:', error);
      } else if (count !== null) {
        setLocalCommentsCount(count);
      }
    };

    fetchCommentCount();
  }, [post.id, supabase]);

  const loadComments = async () => {
    const newState = !showComments;
    setShowComments(newState);

    if (!newState) return;

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
      const loaded = (data as CommentWithUser[]) || [];
      setComments(loaded);
      setLocalCommentsCount(loaded.length);
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
      const loaded = (data as CommentWithUser[]) || [];
      setComments(loaded);
      setLocalCommentsCount(loaded.length);
    }
  };

  const handleCommentAdded = () => {
    refetchComments();
  };

  return (
    <div className="bg-[#121216] rounded-[20px] p-5 space-y-4">
      {/* Шапка поста */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden">
          {post.profiles?.avatar_url ? (
            <img
              src={post.profiles.avatar_url}
              alt={post.profiles.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm font-bold text-zinc-300">
              {post.profiles?.username?.[0]?.toUpperCase() || '?'}
            </span>
          )}
        </div>
        <div>
          <Link
            href={`/profile/${post.user_id}`}
            className="text-[16px] font-medium text-white hover:text-purple-400 transition-colors"
          >
            {post.profiles?.username || 'Пользователь'}
          </Link>
          <div className="text-xs text-zinc-500">
            {new Date(post.created_at).toLocaleDateString('ru-RU')}
          </div>
        </div>
      </div>

      {/* Текст поста */}
      <p className="text-[18px] text-zinc-200 whitespace-pre-wrap leading-relaxed">
        {post.body}
      </p>

      {/* Действия */}
      <div className="flex items-center gap-6 pt-3 border-t border-zinc-800">
        <button
          onClick={onLike}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            isLiked ? 'text-purple-500' : 'text-zinc-400 hover:text-purple-400'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          <span>{post.likes_count + (isLiked ? 1 : 0)}</span>
        </button>

        <button
          onClick={loadComments}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-purple-400 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{localCommentsCount} комментариев</span>
        </button>
      </div>

      {/* Блок комментариев */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <CommentForm 
            postId={post.id} 
            onSuccess={handleCommentAdded} 
          />

          {loadingComments ? (
            <p className="text-center py-8 text-zinc-500">Загрузка комментариев...</p>
          ) : comments.length > 0 ? (
            <div className="mt-6">
              <CommentTree
                comments={comments}
                postId={post.id}
                onCommentAdded={handleCommentAdded}
              />
            </div>
          ) : (
            <p className="text-center py-8 text-zinc-500 text-sm mt-4">
              Пока нет комментариев. Будьте первым!
            </p>
          )}
        </div>
      )}
    </div>
  );
}