'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'

interface Props {
  initialQuery: string
  initialType: string
  initialSort: string
}

export function SearchFilters({ initialQuery, initialType, initialSort }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      value ? params.set(key, value) : params.delete(key)
    })
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
      <div className="relative flex-1 max-w-xl">
        <input
          type="text"
          defaultValue={initialQuery}
          onChange={(e) => updateParams({ q: e.target.value })}
          placeholder="Поиск фильмов, сериалов, аниме..."
          className="w-full h-[50px] pl-6 pr-14 bg-[#121216] rounded-[20px] border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
        />
        {initialQuery && (
          <button onClick={() => updateParams({ q: '' })} className="absolute right-12 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
        <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-white">
          <Search className="w-5 h-5" />
        </button>
      </div>

      <div className="flex gap-3">
        <select defaultValue={initialType} onChange={(e) => updateParams({ type: e.target.value })} className="h-[50px] px-4 bg-[#121216] rounded-[20px] border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-600">
          <option value="all">Все типы</option>
          <option value="movie">Фильмы</option>
          <option value="series">Сериалы</option>
          <option value="anime">Аниме</option>
          <option value="cartoon">Мультфильмы</option>
        </select>

        <select defaultValue={initialSort} onChange={(e) => updateParams({ sort: e.target.value })} className="h-[50px] px-4 bg-[#121216] rounded-[20px] border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-600">
          <option value="rating">По рейтингу</option>
          <option value="title">По названию</option>
          <option value="release_year">По году</option>
          <option value="created_at">По дате</option>
        </select>
      </div>
    </div>
  )
}