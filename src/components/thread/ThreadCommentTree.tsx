'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';
import { ThreadCommentForm } from './ThreadCommentForm';

export type CommentWithUser = {
  id: number;
  content: string;
  created_at: string;
  parent_id: number | null;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  votes: Array<{ value: number }>;
};

interface ThreadCommentTreeProps {
  comments: CommentWithUser[];
  threadId: number;
  onCommentAdded: () => void;
  onNewComment: (newComment: CommentWithUser) => void;
}

export function ThreadCommentTree({ comments: initialComments, threadId, onCommentAdded, onNewComment }: ThreadCommentTreeProps) {
  const [comments, setComments] = useState<CommentWithUser[]>(initialComments);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const { user: currentUser } = useAuthStore();
  const supabase = createClient();

  const [likedComments, setLikedComments] = useState<Record<number, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<number, number>>({});

  // Инициализация лайков
  useEffect(() => {
    setComments(initialComments);

    const initialLikes: Record<number, boolean> = {};
    const initialCounts: Record<number, number> = {};

    initialComments.forEach(comment => {
      const count = comment.votes?.filter(v => v.value === 1).length || 0;
      initialCounts[comment.id] = count;
      initialLikes[comment.id] = comment.votes?.some(v => v.value === 1) || false;
    });

    setLikeCounts(initialCounts);
    setLikedComments(initialLikes);
  }, [initialComments]);

  // Построение дерева комментариев
  const commentTree = useMemo(() => {
    const map = new Map<number, any>();
    const roots: any[] = [];

    // Создаём все узлы
    comments.forEach(comment => {
      map.set(comment.id, { ...comment, replies: [] });
    });

    // Распределяем по родителям
    comments.forEach(comment => {
      const node = map.get(comment.id)!;
      if (comment.parent_id && map.has(comment.parent_id)) {
        map.get(comment.parent_id)!.replies.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [comments]);

  const toggleLike = async (commentId: number) => {
    if (!currentUser) return alert('Войдите в аккаунт');

    const currentlyLiked = likedComments[commentId] || false;
    const currentCount = likeCounts[commentId] || 0;

    setLikedComments(prev => ({ ...prev, [commentId]: !currentlyLiked }));
    setLikeCounts(prev => ({
      ...prev,
      [commentId]: currentlyLiked ? currentCount - 1 : currentCount + 1
    }));

    try {
      await supabase.from('votes').delete().eq('user_id', currentUser.id).eq('comment_id', commentId);

      if (!currentlyLiked) {
        await supabase.from('votes').insert({
          user_id: currentUser.id,
          comment_id: commentId,
          value: 1,
        });
      }
      onCommentAdded();
    } catch (error) {
      console.error(error);
      setLikedComments(prev => ({ ...prev, [commentId]: currentlyLiked }));
      setLikeCounts(prev => ({ ...prev, [commentId]: currentCount }));
    }
  };

  const renderComments = (commentList: any[], depth = 0): React.ReactNode => {
    return commentList.map(comment => (
      <div key={comment.id} className={`ml-${Math.min(depth * 4, 12)} border-l-2 border-zinc-700 pl-4 py-4`}>
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-zinc-700">
            {comment.profiles?.avatar_url ? (
              <img src={comment.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-zinc-700 flex items-center justify-center text-sm font-medium">
                {comment.profiles?.username?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm">
              <Link
                href={`/profile/${comment.profiles?.id || comment.user_id}`} // ← исправлено на id
                className="font-semibold text-[#d9d9d9] hover:text-purple-400"
              >
                @{comment.profiles?.username}
              </Link>
              <span className="text-zinc-500 text-xs">
                {new Date(comment.created_at).toLocaleDateString('ru-RU')}
              </span>
            </div>

            <p className="text-[15px] mt-1 text-[#d9d9d9]">{comment.content}</p>

            <div className="flex gap-5 mt-2 text-sm">
              <button
                onClick={() => toggleLike(comment.id)}
                className={`flex items-center gap-1 ${likedComments[comment.id] ? 'text-purple-500' : 'text-zinc-400 hover:text-purple-500'}`}
              >
                <Heart className={`w-4 h-4 ${likedComments[comment.id] ? 'fill-current' : ''}`} />
                <span>{likeCounts[comment.id] ?? 0}</span>
              </button>

              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="flex items-center gap-1 text-zinc-400 hover:text-purple-500"
              >
                <MessageCircle className="w-4 h-4" />
                Ответить
              </button>
            </div>

            {replyingTo === comment.id && (
              <div className="mt-4">
                <ThreadCommentForm
                  threadId={threadId}
                  parentId={comment.id}
                  onSuccess={onNewComment}
                  placeholder={`Ответить @${comment.profiles?.username}...`}

                />
              </div>
            )}

            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4">
                {renderComments(comment.replies, depth + 1)}
              </div>
            )}
          </div>
        </div>
      </div>
    ));
  };

  if (comments.length === 0) {
    return <p className="text-zinc-500 py-6 text-center">Пока нет комментариев. Будьте первым!</p>;
  }

  return <div className="space-y-1">{renderComments(commentTree)}</div>;
}