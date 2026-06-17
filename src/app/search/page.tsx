import { createClient } from '@/lib/supabase/server'
import { GuestHeader } from '@/components/layout/GuestHeader'
import { AuthHeader } from '@/components/layout/AuthHeader'
import { SearchFilters } from '@/components/search/SearchFilters'
import { MovieCard } from '@/components/movie/MovieCard'

interface SearchPageProps {
  searchParams: Promise<{ q?: string; type?: string; sort?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const params = await searchParams

  const query = params.q || ''
  const typeFilter = params.type || 'all'
  const sortBy = params.sort || 'rating'

  let dbQuery = supabase
    .from('content')
    .select('id, title, poster_url, type, release_year')

  if (query) dbQuery = dbQuery.ilike('title', `%${query}%`)
  if (typeFilter !== 'all') dbQuery = dbQuery.eq('type', typeFilter)

  const orderAsc = sortBy === 'title' || sortBy === 'release_year'
  dbQuery = dbQuery.order(sortBy, { ascending: orderAsc })

  const { data: content, error } = await dbQuery.limit(50)
  if (error) console.error('Search error:', error)

  // 🔥 Пакетная загрузка рейтингов (избегаем N+1 запросов)
  const contentIds = content?.map(c => c.id) || []
  const [reviewsRes, ratingsRes] = await Promise.all([
    contentIds.length ? supabase.from('reviews').select('content_id, rating').in('content_id', contentIds) : { data: [], error: null },
    contentIds.length ? supabase.from('user_ratings').select('content_id, rating').in('content_id', contentIds) : { data: [], error: null }
  ])

  const reviewMap = new Map<number, { total: number; count: number }>()
  reviewsRes.data?.forEach(r => {
    if (!reviewMap.has(r.content_id)) reviewMap.set(r.content_id, { total: 0, count: 0 })
    const curr = reviewMap.get(r.content_id)!
    curr.total += r.rating || 0
    curr.count += 1
  })

  const simpleMap = new Map<number, { total: number; count: number }>()
  ratingsRes.data?.forEach(r => {
    if (!simpleMap.has(r.content_id)) simpleMap.set(r.content_id, { total: 0, count: 0 })
    const curr = simpleMap.get(r.content_id)!
    curr.total += r.rating || 0
    curr.count += 1
  })

  const formattedContent = content?.map(item => ({
    id: item.id,
    title: item.title,
    posterUrl: item.poster_url,
    type: item.type,
    releaseYear: item.release_year,
    reviewRating: reviewMap.has(item.id) ? +(reviewMap.get(item.id)!.total / reviewMap.get(item.id)!.count).toFixed(1) : null,
    simpleRating: simpleMap.has(item.id) ? +(simpleMap.get(item.id)!.total / simpleMap.get(item.id)!.count).toFixed(1) : null,
  })) || []

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      {user ? <AuthHeader /> : <GuestHeader />}
      
      <div className="container mx-auto px-4 py-6">
        <SearchFilters initialQuery={query} initialType={typeFilter} initialSort={sortBy} />
      </div>

      <div className="container mx-auto px-4 py-8">
        {formattedContent.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {formattedContent.map(item => (
              <MovieCard key={item.id} {...item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-xl">Ничего не найдено</p>
            <p className="text-sm mt-2">Попробуйте изменить параметры поиска</p>
          </div>
        )}
      </div>
    </main>
  )
}