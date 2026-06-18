'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { AuthHeader } from '@/components/layout/AuthHeader';
import { GuestHeader } from '@/components/layout/GuestHeader';
import { ReviewsTab } from './ReviewsTab';
import { ThreadsTab } from './ThreadsTab';
import { RatingModal } from './RatingModal';
import { WatchlistModal } from './WatchlistModal';
import SeasonEpisodeList from '@/components/movie/SeasonEpisodeList';
import { createClient } from '@/lib/supabase/client';

type SeasonWithEpisodes = {
  id: number;
  season_number: number;
  episodes: {
    id: number;
    episode_number: number;
    title: string;
    description?: string;
  }[];
};

export function MoviePageClient({ content }: { content: any }) {
  const [activeTab, setActiveTab] = useState<'reviews' | 'threads'>('reviews');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const [seasons, setSeasons] = useState<SeasonWithEpisodes[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<number | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);

  const { user } = useAuthStore();
  const isSeries = ['series', 'anime'].includes(content.type);

  // Загрузка сезонов
  useEffect(() => {
    if (!user || !content.id) return;

    const fetchStatus = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('user_content_status')
        .select('status')
        .eq('user_id', user.id)
        .eq('content_id', content.id)
        .maybeSingle();

      setCurrentStatus(data?.status || null);
    };

    fetchStatus();
  }, [user, content.id]);

  const handleStatusChange = (status: string) => {
    setCurrentStatus(status);
  };

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

            {/* Оценки, описание и т.д. — оставляем как было */}
            <div className="flex gap-8 my-8">
              <div className="group relative cursor-pointer">
                <div className="text-6xl font-bold text-purple-500">
                  {content.rating?.toFixed(1) || '—'}
                </div>
                <div className="absolute hidden group-hover:block bg-zinc-800 text-xs px-3 py-2 rounded-lg -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
                  Рейтинг Kinopoisk
                </div>
              </div>
            </div>

            {/* Описание */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-8 text-zinc-300 leading-relaxed">
              {content.description || 'Описание отсутствует.'}
            </div>

            {/* Дополнительная информация */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-8 space-y-3 text-zinc-300">
              {content.countries?.length > 0 && (
                <p><span className="text-zinc-500">Страна:</span> {content.countries.join(', ')}</p>
              )}
              {content.genres?.length > 0 && (
                <p><span className="text-zinc-500">Жанры:</span> {content.genres.join(', ')}</p>
              )}
              {content.duration && (
                <p><span className="text-zinc-500">Длительность:</span> {content.duration} мин.</p>
              )}
              {content.age_rating && (
                <p><span className="text-zinc-500">Возраст:</span> {content.age_rating}</p>
              )}

              {/* Режиссёры */}
              {content.directors?.length > 0 && (
                <p>
                  <span className="text-zinc-500">Режиссёр{content.directors.length > 1 ? 'ы' : ''}:</span>{' '}
                  {content.directors.join(', ')}
                </p>
              )}

              {/* Актёры */}
              {content.actors?.length > 0 && (
                <p>
                  <span className="text-zinc-500">В главных ролях:</span>{' '}
                  {content.actors.slice(0, 10).join(', ')}
                  {content.actors.length > 10 && ' и др.'}
                </p>
              )}
            </div>

            {/* === ВЫБОР СЕЗОНОВ И СЕРИЙ === */}
            {isSeries && seasons.length > 0 && (
              <div className="mb-12">
                <SeasonEpisodeList
                  seasons={seasons}
                  contentId={content.id}
                  selectedEpisodeId={selectedEpisodeId}
                  onEpisodeSelect={setSelectedEpisodeId}
                />
              </div>
            )}

            {/* Табы */}
            <div className="flex flex-wrap gap-3 mb-8 border-b border-zinc-800 pb-4">
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-8 py-3 text-[#d9d9d9] rounded-2xl font-medium transition ${activeTab === 'reviews' ? 'bg-purple-600' : 'bg-zinc-900 hover:bg-zinc-800'}`}
              >
                Рецензии
              </button>
              <button
                onClick={() => setActiveTab('threads')}
                className={`px-8 py-3 text-[#d9d9d9] rounded-2xl font-medium transition ${activeTab === 'threads' ? 'bg-purple-600' : 'bg-zinc-900 hover:bg-zinc-800'}`}
              >
                Треды
              </button>
              <button
                onClick={() => setShowRatingModal(true)}
                className="px-8 py-3 text-[#d9d9d9] bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-2xl font-medium transition"
              >
                Оценить
              </button>
              <button
                onClick={() => setShowWatchlistModal(true)}
                className="px-8 py-3 text-[#d9d9d9] bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-2xl font-medium transition flex items-center gap-2"
              >
                {currentStatus ? statusLabels[currentStatus] : 'В избранное'}
              </button>
            </div>

            {activeTab === 'reviews' && (
              <ReviewsTab contentId={content.id} episodeId={selectedEpisodeId} />
            )}
            {activeTab === 'threads' && (
              <ThreadsTab contentId={content.id} episodeId={selectedEpisodeId} />
            )}
          </div>
        </div>
      </div>

      {showRatingModal && <RatingModal contentId={content.id} onClose={() => setShowRatingModal(false)} />}
      {showWatchlistModal && (
        <WatchlistModal 
          contentId={content.id} 
          onClose={() => setShowWatchlistModal(false)} 
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}