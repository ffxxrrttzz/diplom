'use client';

import { useState } from 'react';
import { Play, Star, MessageSquare, Edit3 } from 'lucide-react';

interface Episode {
  id: number;
  episode_number: number;
  title: string;
  description?: string;
}

interface Season {
  id: number;
  season_number: number;
  episodes: Episode[];
}

interface SeasonEpisodeListProps {
  seasons: Season[];
  contentId: number;
  selectedEpisodeId?: number | null;
  onEpisodeSelect: (episodeId: number | null) => void;
}

export default function SeasonEpisodeList({
  seasons,
  contentId,
  selectedEpisodeId,
  onEpisodeSelect,
}: SeasonEpisodeListProps) {
  const [selectedSeason, setSelectedSeason] = useState(seasons[0]?.season_number || 1);

  const currentSeason = seasons.find(s => s.season_number === selectedSeason);

  return (
    <div className="bg-[#121216] rounded-3xl p-8">
      <h3 className="text-2xl font-semibold mb-8">Сезоны и серии</h3>

      <div className="flex gap-8">
        {/* Вертикальный список сезонов */}
        <div className="w-52 flex-shrink-0">
          <div className="text-gray-400 text-sm mb-4">СЕЗОНЫ</div>
          <div className="space-y-2">
            {seasons.map((season) => (
              <button
                key={season.id}
                onClick={() => {
                  setSelectedSeason(season.season_number);
                  onEpisodeSelect(null);
                }}
                className={`w-full text-left px-6 py-4 rounded-2xl transition-all text-lg ${
                  selectedSeason === season.season_number
                    ? 'bg-yellow-400 text-black font-medium'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                }`}
              >
                Сезон {season.season_number}
              </button>
            ))}
          </div>
        </div>

        {/* Список серий */}
        <div className="flex-1">
          <div className="text-gray-400 text-sm mb-4">
            СЕРИИ — СЕЗОН {selectedSeason}
          </div>

          <div className="space-y-3 max-h-[520px] overflow-auto pr-4 custom-scrollbar">
            {currentSeason?.episodes
              ?.sort((a, b) => a.episode_number - b.episode_number)
              .map((ep) => (
                <div
                  key={ep.id}
                  onClick={() => onEpisodeSelect(ep.id)}
                  className={`group flex gap-5 p-5 rounded-2xl border transition-all cursor-pointer ${
                    selectedEpisodeId === ep.id
                      ? 'border-yellow-400 bg-yellow-400/10'
                      : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-xl font-bold text-zinc-400 group-hover:text-yellow-400 transition">
                    {ep.episode_number}
                  </div>

                  <div className="flex-1">
                    <p className="font-medium text-white group-hover:text-yellow-300 transition-colors">
                      {ep.title || `Эпизод ${ep.episode_number}`}
                    </p>
                    {ep.description && (
                      <p className="text-sm text-zinc-500 line-clamp-2 mt-1.5">
                        {ep.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Можно добавить быстрые действия
                      }}
                      className="p-3 hover:bg-zinc-800 rounded-xl"
                    >
                     
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}