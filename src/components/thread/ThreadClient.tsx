'use client';

import type { Database } from '@/types/database.types';
import { ThreadCommentTree } from './ThreadCommentTree';
import { ThreadCommentForm } from './ThreadCommentForm';
import { useState } from 'react';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { AuthHeader } from '@/components/layout/AuthHeader';
import { GuestHeader } from '@/components/layout/GuestHeader';

type ThreadWithAuthor = Database['public']['Tables']['threads']['Row'] & {
  author: Database['public']['Tables']['profiles']['Row'] | null;
};

type CommentWithUser = {
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

interface ThreadClientProps {
  thread: ThreadWithAuthor;
  initialComments: CommentWithUser[];
}

export function ThreadClient({ thread, initialComments }: ThreadClientProps) {
  const [comments, setComments] = useState<CommentWithUser[]>(initialComments);
  const { user } = useAuthStore();

  const handleNewComment = (newComment: CommentWithUser) => {
    setComments(prev => {
      if (newComment.parent_id) {
        // Ответ — вставляем сразу после родителя
        const parentIndex = prev.findIndex(c => c.id === newComment.parent_id);
        if (parentIndex !== -1) {
          const newList = [...prev];
          newList.splice(parentIndex + 1, 0, newComment);
          return newList;
        }
      }
      // Новый основной комментарий — в начало
      return [newComment, ...prev];
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {user ? <AuthHeader /> : <GuestHeader />}

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Блок треда */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <Link 
              href={`/profile/${thread.author?.id}`}
              className="flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden border border-zinc-700 flex-shrink-0">
                {thread.author?.avatar_url ? (
                  <img src={thread.author.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-700 flex items-center justify-center font-medium text-lg">
                    {thread.author?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold text-lg text-[#d9d9d9] group-hover:text-purple-500">
                  @{thread.author?.username}
                </p>
                <p className="text-sm text-zinc-500">
                  {new Date(thread.created_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </Link>

            <button className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-2xl font-medium text-[#d9d9d9]">
              <UserPlus size={18} />
              Подписаться
            </button>
          </div>

          <h1 className="text-3xl font-bold mt-8 mb-5 text-[#d9d9d9]">{thread.title}</h1>
          <p className="text-[17px] leading-relaxed text-[#d9d9d9] whitespace-pre-wrap">
            {thread.content}
          </p>
        </div>

        {/* Форма нового комментария */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-8">
          <ThreadCommentForm 
            threadId={thread.id} 
            onSuccess={handleNewComment} 
          />
        </div>

        {/* Дерево комментариев */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
          <h2 className="text-xl font-semibold mb-6 text-[#d9d9d9]">
            Комментарии ({comments.length})
          </h2>
          <ThreadCommentTree 
            comments={comments}
            threadId={thread.id}
            onNewComment={handleNewComment} // ← Изменено на onNewComment
            onCommentAdded={function (): void {
              throw new Error('Function not implemented.');
            } }                     />
        </div>
      </div>
    </div>
  );
}