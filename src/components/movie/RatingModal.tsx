'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';

interface RatingModalProps {
  contentId: number;
  onClose: () => void;
  onRatingSubmitted?: () => void;   // ← новое
}

export function RatingModal({ contentId, onClose, onRatingSubmitted }: RatingModalProps) {
  const [rating, setRating] = useState(7);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const supabase = createClient();

  const submitRating = async () => {
    if (!user) return;
    setLoading(true);

    const { error } = await supabase.from('user_ratings').upsert({
      user_id: user.id,
      content_id: contentId,
      rating,
    });

    setLoading(false);

    if (!error) {
      onRatingSubmitted?.();   // ← уведомляем родителя
      onClose();
    } else {
      alert('Ошибка при сохранении оценки');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-10 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">Поставьте оценку</h2>
        
        <div className="grid text-[#d9d9d9] grid-cols-5 gap-3 mb-10">
          {[1,2,3,4,5,6,7,8,9,10].map(num => (
            <button
              key={num}
              onClick={() => setRating(num)}
              className={`h-16 w-16 rounded-2xl text-3xl font-semibold transition-all ${
                rating === num ? 'bg-purple-600 text-white scale-110' : 'bg-zinc-800 hover:bg-zinc-700'
              }`}
            >
              {num}
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl font-medium text-[#d9d9d9] cursor-pointer"
          >
            Отмена
          </button>
          <button 
            onClick={submitRating}
            disabled={loading}
            className="flex-1 py-4 text-[#d9d9d9] bg-purple-600 hover:bg-purple-700 rounded-2xl font-medium cursor-pointer"
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}