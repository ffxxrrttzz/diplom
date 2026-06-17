'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';

interface CommentFormProps {
  postId: number;
  parentId?: number | null;
  onSuccess?: () => void;
  placeholder?: string;
}

export function CommentForm({
  postId,
  parentId = null,
  onSuccess,
  placeholder = 'Напишите комментарий...',
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const { user } = useAuthStore();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim() || loading) {
      console.log('❌ Не хватает данных:', { user: !!user, content: content.trim() });
      return;
    }
    if (!user) {
    alert('Пожалуйста, войдите в аккаунт');
    return;
}

    setLoading(true);
    console.log('📤 Отправка комментария:', { postId, parentId, userId: user.id, content: content.trim() });

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
        parent_id: parentId,
        parent_comment_id: parentId,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Ошибка Supabase:', error);
      console.error('Код ошибки:', error.code);
      console.error('Сообщение:', error.message);
      alert(`Ошибка: ${error.message}`);
    } else {
      console.log('✅ Комментарий успешно сохранён!', data);
      setContent('');
      onSuccess?.();
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
          className="w-full bg-zinc-900 border bg-purple-400 hover:border-purple-500 rounded-xl p-4 text-[15px] resize-y min-h-[80px]"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !content.trim()}
        className="self-end px-6 py-3 bg-purple-800 hover:bg-purple-700 disabled:bg-zinc-700 font-medium rounded-xl"
      >
        {loading ? 'Отправка...' : parentId ? 'Ответить' : 'Отправить'}
      </button>
    </form>
  );
}