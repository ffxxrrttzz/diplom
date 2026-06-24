'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { AuthHeader } from '@/components/layout/AuthHeader';
import { GuestHeader } from '@/components/layout/GuestHeader';
import { ReviewsTab } from './ReviewsTab';
import { ThreadsTab } from '@/components/profile/tabs/ThreadsTab';
import { RatingModal } from './RatingModal';
import { WatchlistModal } from './WatchlistModal';
import SeasonEpisodeList from '@/components/movie/SeasonEpisodeList';
import { createClient } from '@/lib/supabase/client';

export function MoviePageClient({ content }: { content: any }) {
  const [activeTab, setActiveTab] = useState<'reviews' | 'threads'>('reviews');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<number | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [averageRatings, setAverageRatings] = useState({ all: null as number | null, withReview: null as number | null });

  const { user } = useAuthStore();
  const isSeries = ['series', 'anime'].includes(content?.type || '');

  // Защита
  if (!content || !content.id) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Контент не найден</h1>
          <p className="text-zinc-400">Возможно, такой фильм/сериал ещё не добавлен в базу.</p>
        </div>
      </div>
    );
  }

  const fetchAverageRatings = useCallback(async () => {
    const supabase = createClient();
    const [allRes, reviewRes] = await Promise.all([
      supabase.from('user_ratings').select('rating').eq('content_id', content.id),
      supabase.from('reviews').select('rating').eq('content_id', content.id).not('rating', 'is', null)
    ]);

    const allRatings = allRes.data || [];
    const reviewRatings = reviewRes.data || [];

    const avgAll = allRatings.length 
      ? Number((allRatings.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / allRatings.length).toFixed(1))
      : null;

    const avgWithReview = reviewRatings.length 
      ? Number((reviewRatings.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviewRatings.length).toFixed(1))
      : null;

    setAverageRatings({ all: avgAll, withReview: avgWithReview });
  }, [content.id]);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      if (user) {
        const { data: statusData } = await supabase
          .from('user_content_status')
          .select('status')
          .eq('user_id', user.id)
          .eq('content_id', content.id)
          .maybeSingle();

        setCurrentStatus(statusData?.status || null);
      }

      // Загрузка сезонов
      if (isSeries) {
        setLoadingSeasons(true);
        const { data } = await supabase
          .from('seasons')
          .select(`
            id, 
            season_number,
            episodes(id, episode_number, title, description, poster_path)
          `)
          .eq('content_id', content.id)
          .order('season_number', { ascending: true });

        setSeasons(data || []);
        setLoadingSeasons(false);
      }

      await fetchAverageRatings();
    };

    fetchData();
  }, [content.id, user, isSeries, fetchAverageRatings]);

  const statusLabels: Record<string, string> = {
    watching: 'Смотрю',
    watched: 'Просмотрено',
    planned: 'В планах',
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {user ? <AuthHeader /> : <GuestHeader />}

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Постер */}
          <div className="lg:w-[340px] flex-shrink-0">
            <div className="aspect-[2/3] bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800">
              <img
                src={content.poster_url || '/placeholder-poster.jpg'}
                alt={content.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Основная информация */}
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-[#d9d9d9] mb-1">{content.title}</h1>
            {content.original_title && (
              <p className="text-zinc-500 text-xl mb-6">{content.original_title}</p>
            )}

            {/* Средние оценки */}
            <div className="flex gap-8 my-8">
              <div className="group relative cursor-pointer">
                <div className="text-6xl font-bold text-purple-500">
                  {averageRatings.all?.toFixed(1) || '—'}
                </div>
              </div>
              {averageRatings.withReview && (
                <div className="group relative cursor-pointer">
                  <div className="text-6xl font-bold text-[#FFD700]">
                    {averageRatings.withReview.toFixed(1)}
                  </div>
                </div>
              )}
            </div>

            {/* Описание и информация */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-8 text-zinc-300 leading-relaxed">
              {content.description || 'Описание отсутствует.'}
            </div>

            {/* Дополнительная информация */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-8 space-y-3 text-zinc-300">
              {content.countries?.length > 0 && <p><span className="text-zinc-500">Страны:</span> {content.countries.join(', ')}</p>}
              {content.genres?.length > 0 && <p><span className="text-zinc-500">Жанры:</span> {content.genres.join(', ')}</p>}
              {content.duration && <p><span className="text-zinc-500">Длительность:</span> {content.duration} мин.</p>}
              {content.age_rating && <p><span className="text-zinc-500">Возрастной рейтинг:</span> {content.age_rating}</p>}
            </div>

            {/* Сезоны */}
            {isSeries && (
              <div className="mb-12">
                {loadingSeasons ? (
                  <div className="bg-[#121216] rounded-3xl p-8 text-center">Загрузка сезонов...</div>
                ) : seasons.length > 0 ? (
                  <SeasonEpisodeList
                    seasons={seasons}
                    contentId={content.id}
                    selectedEpisodeId={selectedEpisodeId}
                    onEpisodeSelect={setSelectedEpisodeId}
                  />
                ) : (
                  <div className="bg-[#121216] rounded-3xl p-8 text-center text-zinc-500">
                    Сезоны пока не добавлены
                  </div>
                )}
              </div>
            )}

            {/* Табы */}
            <div className="flex flex-wrap gap-3 mb-8 border-b border-zinc-800 pb-4">
              <button onClick={() => setActiveTab('reviews')} className={`px-8 py-3 rounded-2xl font-medium transition ${activeTab === 'reviews' ? 'bg-purple-600' : 'bg-zinc-900 hover:bg-zinc-800'}`}>
                Рецензии
              </button>
              <button onClick={() => setActiveTab('threads')} className={`px-8 py-3 rounded-2xl font-medium transition ${activeTab === 'threads' ? 'bg-purple-600' : 'bg-zinc-900 hover:bg-zinc-800'}`}>
                Треды
              </button>
              <button onClick={() => setShowRatingModal(true)} className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-2xl font-medium transition">
                Оценить
              </button>
              <button onClick={() => setShowWatchlistModal(true)} className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-2xl font-medium transition">
                {currentStatus ? statusLabels[currentStatus] : 'В планах'}
              </button>
            </div>

            {activeTab === 'reviews' && <ReviewsTab contentId={content.id} episodeId={selectedEpisodeId} />}
            {activeTab === 'threads' && <ThreadsTab contentId={content.id} episodeId={selectedEpisodeId} />}
          </div>
        </div>
      </div>

      {showRatingModal && <RatingModal contentId={content.id} onClose={() => setShowRatingModal(false)} onRatingSubmitted={() => {}} />}
      {showWatchlistModal && <WatchlistModal contentId={content.id} onClose={() => setShowWatchlistModal(false)} onStatusChange={(status) => setCurrentStatus(status)} />}
    </div>
  );
}