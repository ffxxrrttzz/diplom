// src/components/movie/MoviesSlider.tsx
'use client' // 🔥 Нужен для интерактивности

import { useRef } from 'react'
import { MovieCard } from './MovieCard'

interface MoviesSliderProps {
  title: string
  movies: Array<{
    id: number
    title: string
    posterUrl: string | null
    kinopoiskRating?: number | null
    customRating?: number | null
  }>
}

export function MoviesSlider({ title, movies }: MoviesSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef
      const scrollAmount = direction === 'left' ? -400 : 400
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  // 🔥 Если фильмов нет — не показываем слайдер
  if (!movies || movies.length === 0) {
    return null
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-medium text-white">{title}</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => scroll('left')}
            className="p-2 rounded-full hover:bg-zinc-800 transition-colors disabled:opacity-50"
            aria-label="Назад"
          >
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={() => scroll('right')}
            className="p-2 rounded-full hover:bg-zinc-800 transition-colors disabled:opacity-50"
            aria-label="Вперёд"
          >
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
      >
        {movies.map((movie) => (
          <MovieCard key={movie.id} {...movie} />
        ))}
      </div>
    </section>
  )
}