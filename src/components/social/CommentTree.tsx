'use client';

import React, { useState } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { CommentForm } from './CommentForm';
import { useAuthStore } from '@/store/auth-store';

export type CommentWithUser = {
  id: number;
  content: string;
  created_at: string;
  parent_id: number | null;
  likes_count?: number;           // ← важно: optional number
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  votes: Array<{ value: number }>;
};

interface CommentTreeProps {
  comments: CommentWithUser[];
  postId: number;
  onCommentAdded: () => void;
}

export function CommentTree({ comments, postId, onCommentAdded }: CommentTreeProps) {
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const { user: currentUser } = useAuthStore();
  const supabase = createClient();

        const toggleLike = async (commentId: number, isCurrentlyLiked: boolean) => {
    if (!currentUser) {
      alert('Пожалуйста, войдите в аккаунт');
      return;
    }

    try {
      if (isCurrentlyLiked) {
        const { error } = await supabase
          .from('votes')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('comment_id', commentId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('votes')
          .insert({
            user_id: currentUser.id,
            comment_id: commentId,
            post_id: null,
            thread_id: null,
            review_id: null,
            value: 1,
          });

        if (error) throw error;
      }

      console.log(`✅ Лайк ${isCurrentlyLiked ? 'снят' : 'поставлен'}`);
      await onCommentAdded();
      onCommentAdded();
    } catch (error: any) {
      console.error('Ошибка лайка:', error);
      alert(`Не удалось поставить лайк: ${error.message}`);
    }
  };

  const renderComments = (parentId: number | null = null, depth: number = 0): React.ReactNode => {
    const filtered = comments.filter(c => c.parent_id === parentId);

    return filtered.map(comment => {
      const likeCount = comment.votes?.filter(v => v.value === 1).length || 0;
      const isLiked = comment.votes?.some(v => v.value === 1) || false;

      return (
        <div
          key={comment.id}
          className={`ml-${Math.min(depth * 4, 12)} border-l-2 border-zinc-700 pl-4 py-4`}
        >
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-zinc-700">
              {comment.profiles.avatar_url ? (
                <img
                  src={comment.profiles.avatar_url}
                  alt={comment.profiles.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-zinc-700 flex items-center justify-center text-sm font-medium">
                  {comment.profiles.username?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">@{comment.profiles.username}</span>
                <span className="text-zinc-500 text-xs">
                  {new Date(comment.created_at).toLocaleDateString('ru-RU')}
                </span>
              </div>

              <p className="text-[15px] mt-1">{comment.content}</p>

              <div className="flex gap-5 mt-2 text-sm">
                <button
                  onClick={() => toggleLike(comment.id, isLiked)}
                  className={`flex items-center gap-1 ${isLiked ? 'text-purple-500' : 'text-zinc-400 hover:text-purple-400'}`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{likeCount}</span>
                </button>

                <button
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="flex items-center gap-1 text-zinc-400 hover:text-purple-300"
                >
                  <MessageCircle className="w-4 h-4" />
                  Ответить
                </button>
              </div>

              {replyingTo === comment.id && (
                <div className="mt-4">
                  <CommentForm
                    postId={postId}
                    parentId={comment.id}
                    onSuccess={() => {
                      setReplyingTo(null);
                      onCommentAdded();
                    }}
                    placeholder={`Ответить @${comment.profiles.username}...`}
                  />
                </div>
              )}

              {renderComments(comment.id, depth + 1)}
            </div>
          </div>
        </div>
      );
    });
  };

  if (comments.length === 0) {
    return <p className="text-zinc-500 py-6 text-center">Пока нет комментариев. Будьте первым!</p>;
  }

  return <div className="space-y-1">{renderComments()}</div>;
}