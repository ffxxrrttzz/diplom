'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import { Heart } from 'lucide-react';

type Review = {
  id: number;
  title: string | null;
  text: string;
  rating: number | null;
  created_at: string;
  likes_count: number;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
};

export function ReviewsTab({ 
  contentId, 
  episodeId 
}: { 
  contentId: number; 
  episodeId?: number | null;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewRating, setNewReviewRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [likedReviews, setLikedReviews] = useState<Set<number>>(new Set()); // ← для UI

  const { user } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    fetchReviews();
  }, [contentId, episodeId]);

  const fetchReviews = async () => {
    setLoading(true);
    let query = supabase
      .from('reviews')
      .select(`
        *,
        profiles!reviews_user_id_fkey (username, avatar_url)
      `)
      .eq('content_id', contentId)
      .order('created_at', { ascending: false });

    if (episodeId) {
      query = query.eq('episode_id', episodeId);
    }

    const { data } = await query;
    setReviews(data || []);

    // Загружаем, какие рецензии уже лайкнул текущий пользователь
    if (user && data) {
      const reviewIds = data.map(r => r.id);
      const { data: votes } = await supabase
        .from('votes')
        .select('review_id')
        .in('review_id', reviewIds)
        .eq('user_id', user.id);

      const likedSet = new Set(votes?.map(v => v.review_id) || []);
      setLikedReviews(likedSet);
    }

    setLoading(false);
  };

  const toggleLike = async (reviewId: number) => {
    if (!user) return alert('Войдите в аккаунт');

    const isCurrentlyLiked = likedReviews.has(reviewId);

    // Оптимистичное обновление
    setLikedReviews(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyLiked) newSet.delete(reviewId);
      else newSet.add(reviewId);
      return newSet;
    });

    setReviews(prev => 
      prev.map(review => 
        review.id === reviewId 
          ? { 
              ...review, 
              likes_count: isCurrentlyLiked 
                ? Math.max(0, review.likes_count - 1) 
                : review.likes_count + 1 
            }
          : review
      )
    );

    try {
      if (isCurrentlyLiked) {
        await supabase
          .from('votes')
          .delete()
          .eq('user_id', user.id)
          .eq('review_id', reviewId);
      } else {
        await supabase
          .from('votes')
          .insert({
            user_id: user.id,
            review_id: reviewId,
            value: 1,
          });
      }

      // Небольшая задержка для синхронизации с триггером
      setTimeout(fetchReviews, 500);
    } catch (err) {
      console.error(err);
      fetchReviews(); // откат при ошибке
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newReviewText.trim()) return;

    setSubmitting(true);

    try {
      let ratingId: number | null = null;

      if (newReviewRating !== null) {
        const { data: ratingData, error: ratingError } = await supabase
          .from('ratings')
          .insert({
            user_id: user.id,
            content_id: contentId,
            episode_id: episodeId || null,
            score: newReviewRating,
          })
          .select('id')
          .single();

        if (ratingError) throw ratingError;
        ratingId = ratingData.id;
      }

      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          content_id: contentId,
          episode_id: episodeId || null,
          rating_id: ratingId,
          title: newReviewTitle.trim() || null,
          text: newReviewText.trim(),
          rating: newReviewRating,
        });

      if (reviewError) throw reviewError;

      setNewReviewText('');
      setNewReviewTitle('');
      setNewReviewRating(null);
      await fetchReviews();

    } catch (error: any) {
      console.error('Ошибка создания рецензии:', error);
      alert(`Не удалось опубликовать рецензию: ${error.message || 'Проверьте консоль'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Форма написания рецензии */}
      {user && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <h3 className="text-xl font-semibold text-[#d9d9d9] mb-4">
            {episodeId ? `Рецензия на серию` : 'Рецензия на контент'}
          </h3>
          
          <form onSubmit={submitReview} className="space-y-4">
            <input
              type="text"
              placeholder="Заголовок рецензии (необязательно)"
              value={newReviewTitle}
              onChange={(e) => setNewReviewTitle(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-3 text-[#d9d9d9] focus:border-purple-500 outline-none"
            />

            <textarea
              placeholder="Ваша рецензия..."
              value={newReviewText}
              onChange={(e) => setNewReviewText(e.target.value)}
              rows={5}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 text-[#d9d9d9] focus:border-purple-500 outline-none resize-y min-h-[140px]"
              required
            />

            <div>
              <p className="text-zinc-400 mb-2">Оценка (необязательно)</p>
              <div className="flex gap-2 flex-wrap">
                {[1,2,3,4,5,6,7,8,9,10].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setNewReviewRating(num)}
                    className={`w-11 h-11 rounded-xl font-semibold transition-all ${
                      newReviewRating === num 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                    }`}
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setNewReviewRating(null)}
                  className="px-4 py-2.5 text-sm text-zinc-400 hover:text-white"
                >
                  Без оценки
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !newReviewText.trim()}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-700 rounded-2xl font-medium text-white transition cursor-pointer"
            >
              {submitting ? 'Публикация...' : 'Опубликовать рецензию'}
            </button>
          </form>
        </div>
      )}

      {/* Список рецензий */}
      <div className="space-y-6">
        {loading ? (
          <p className="text-zinc-500 py-10 text-center">Загрузка рецензий...</p>
        ) : reviews.length === 0 ? (
          <p className="text-zinc-500 py-10 text-center">
            {episodeId ? 'Пока нет рецензий на эту серию.' : 'Пока нет рецензий. Будьте первым!'}
          </p>
        ) : (
          reviews.map((review) => {
            const isLiked = likedReviews.has(review.id);

            return (
              <div key={review.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={review.profiles.avatar_url || '/default-avatar.png'}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-[#d9d9d9]">@{review.profiles.username}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(review.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>

                {review.title && <h3 className="text-lg font-semibold text-white mb-3">{review.title}</h3>}
                
                <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{review.text}</p>

                {review.rating && (
                  <div className="mt-4 inline-block bg-zinc-800 text-[#FFD700] px-4 py-1 rounded-full text-sm">
                    Оценка: {review.rating}/10
                  </div>
                )}

                <div className="flex items-center gap-6 mt-5">
                  <button
                    type="button"   // ← важно
                    onClick={() => toggleLike(review.id)}
                    className={`flex items-center gap-2 transition cursor-pointer ${
                      isLiked ? 'text-purple-500' : 'text-zinc-400 hover:text-purple-500'
                    }`}
                  >
                    <Heart 
                      className={`w-5 h-5 transition ${isLiked ? 'fill-current' : ''}`} 
                    />
                    <span className="font-medium">{Math.max(0, review.likes_count)}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}