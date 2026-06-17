'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export function SearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск фильмов, сериалов, аниме..."
        className="w-full h-[50px] pl-6 pr-14 bg-[#121216] rounded-[20px] border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
      />
      <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-white">
        <Search className="w-5 h-5" />
      </button>
    </form>
  )
}