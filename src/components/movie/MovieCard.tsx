'use client' // 🔥 ОБЯЗАТЕЛЬНО: первая строка файла

import Link from 'next/link'
import { Star, MessageSquare } from 'lucide-react'
import { useState } from 'react'

interface MovieCardProps {
  id: number
  title: string
  posterUrl: string | null
  reviewRating?: number | null
  simpleRating?: number | null
  type?: string
  releaseYear?: number | null
}

const TYPE_LABELS: Record<string, string> = {
  movie: 'Фильм', series: 'Сериал', anime: 'Аниме', cartoon: 'Мультфильм'
}

export function MovieCard({
  id, title, posterUrl, reviewRating, simpleRating, type, releaseYear
}: MovieCardProps) {
  const [imgError, setImgError] = useState(false)

  return (
    <Link href={`/movie/${id}`} className="group relative w-40 flex-shrink-0">
      <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-800">
        {!imgError && posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            className="object-cover w-full h-full transition-transform group-hover:scale-105"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
            <span className="text-3xl">🎬</span>
          </div>
        )}
        
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {reviewRating != null && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-400/90 text-zinc-900 text-xs font-bold rounded-full shadow-[0_0_8px_1px_rgba(255,215,0,0.3)]">
              <MessageSquare className="w-2.5 h-2.5" /> {reviewRating}
            </span>
          )}
          {simpleRating != null && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-700/90 text-zinc-100 text-xs font-bold rounded-full shadow-[0_0_8px_2px_rgba(114,14,156,0.3)]">
              <Star className="w-2.5 h-2.5 fill-current" /> {simpleRating}
            </span>
          )}
        </div>

        {type && TYPE_LABELS[type] && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-purple-700/90 rounded text-[10px] text-white font-medium">
            {TYPE_LABELS[type]}
          </div>
        )}
        
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-900/80 to-transparent" />
      </div>

      <div className="mt-2 space-y-1">
        <p className="text-sm text-zinc-300 line-clamp-1 group-hover:text-white transition-colors">{title}</p>
        {releaseYear && <p className="text-xs text-zinc-500">{releaseYear}</p>}
      </div>
    </Link>
  )
}