'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';

interface ThreadCommentFormProps {
  threadId: number;
  parentId?: number | null;
  onSuccess?: (newComment: any) => void;
  placeholder?: string;
}

export function ThreadCommentForm({
  threadId,
  parentId = null,
  onSuccess,
  placeholder = 'Напишите комментарий...',
}: ThreadCommentFormProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const { user } = useAuthStore();
  const supabase = createClient();

  if (!user) {
    return (
      <div className="text-center py-8 text-zinc-500 border border-dashed border-zinc-700 rounded-2xl">
        Войдите в аккаунт, чтобы оставлять комментарии
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);

    const { data, error } = await supabase
      .from('comments')
      .insert({
        thread_id: threadId,
        user_id: user.id,
        content: content.trim(),
        parent_id: parentId,
      })
      .select(`
        *,
        profiles!comments_user_id_fkey (username, avatar_url)
      `)
      .single();

    if (error) {
      console.error(error);
      alert('Ошибка при отправке комментария');
    } else if (data) {
      const newComment = {
        ...data,
        profiles: data.profiles || {
          username: user.user_metadata?.username || 
                    user.email?.split('@')[0] || 
                    'Пользователь',
          avatar_url: null,
        },
        votes: []
      };
      onSuccess?.(newComment);
      setContent('');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <div className="flex-1">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full bg-zinc-900 border border-zinc-700 focus:border-purple-500 rounded-2xl p-4 text-[15px] resize-y min-h-[88px] text-[#d9d9d9]"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !content.trim()}
        className="self-end px-7 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-700 font-medium rounded-2xl transition text-white"
      >
        {loading ? 'Отправка...' : parentId ? 'Ответить' : 'Отправить'}
      </button>
    </form>
  );
}