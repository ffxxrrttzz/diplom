// src/components/profile/tabs/RatingsTab.tsx
'use client'

import { Star } from 'lucide-react'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'

interface RatingType {
  id: number
  rating: number
  created_at: string
  content_id: number
  content?: {
    title: string
    poster_url: string | null
    type?: string
  } | null
}

interface RatingsTabProps {
  ratings: RatingType[]
  currentUser?: User | null
}

export function RatingsTab({ ratings, currentUser }: RatingsTabProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {ratings.length > 0 ? (
        ratings.map((item) => (
          <Link 
            key={item.id}
            href={`/movie/${item.content_id}`}
            className="group bg-[#121216] rounded-[10px] p-3 flex flex-col items-center gap-3 hover:ring-2 ring-purple-600 transition-all"
          >
            {/* Постер */}
            <div className="w-full aspect-[2/3] rounded-[10px] bg-zinc-800 overflow-hidden relative">
              {item.content?.poster_url ? (
                <img 
                  src={item.content.poster_url} 
                  alt={item.content.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                  <span className="text-3xl">🎬</span>
                </div>
              )}
              
              {/* Бейдж типа контента */}
              {item.content?.type && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-purple-700/90 rounded text-[10px] text-white font-medium capitalize">
                  {item.content.type === 'movie' ? 'Фильм' : 
                   item.content.type === 'series' ? 'Сериал' : 
                   item.content.type === 'anime' ? 'Аниме' : 'Мультфильм'}
                </div>
              )}
            </div>

            {/* Название и рейтинг */}
            <div className="w-full text-center">
              <p className="text-[14px] text-zinc-300 line-clamp-2 group-hover:text-white transition-colors min-h-[32px]">
                {item.content?.title || 'Без названия'}
              </p>
              <div className="flex items-center justify-center gap-1 mt-1 text-[#720e9c] font-bold">
                <Star className="w-4 h-4 fill-current" /> 
                <span className="text-[18px]">{item.rating.toFixed(1)}</span>
              </div>
              <p className="text-[12px] text-zinc-500">
                {new Date(item.created_at).toLocaleDateString('ru-RU')}
              </p>
            </div>
          </Link>
        ))
      ) : (
        <div className="col-span-full text-center py-12 text-zinc-500 bg-[#121216] rounded-[20px]">
          <p className="text-xl mb-2">Пока нет оценок</p>
          {currentUser && (
            <p className="text-sm">Оцените контент, чтобы он появился здесь!</p>
          )}
        </div>
      )}
    </div>
  )
}