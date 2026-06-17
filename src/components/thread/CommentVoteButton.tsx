'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function CommentVoteButton({ commentId }: { commentId: number }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async () => {
    setIsLoading(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Войдите в аккаунт, чтобы поставить лайк');
      setIsLoading(false);
      return;
    }

    // Удаляем предыдущий голос
    await supabase
      .from('votes')
      .delete()
      .eq('user_id', user.id)
      .eq('comment_id', commentId);

    // Добавляем новый
    const { error } = await supabase
      .from('votes')
      .insert({
        user_id: user.id,
        comment_id: commentId,
        value: 1,
      });

    if (!error) {
      setIsLiked(true);
    } else {
      console.error('Ошибка при лайке:', error);
    }

    setIsLoading(false);
  };

  return (
    <button
      onClick={handleLike}
      disabled={isLoading}
      className={`flex items-center gap-1.5 text-sm transition-colors ${
        isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
      }`}
    >
      <Heart size={18} className={isLiked ? 'fill-current' : ''} />
      Нравится
    </button>
  );
}