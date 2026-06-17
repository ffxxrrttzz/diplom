import { createClient } from '@/lib/supabase/server'
import { GuestHeader } from '@/components/layout/GuestHeader'
import { AuthHeader } from '@/components/layout/AuthHeader'
import { MoviesSlider } from '@/components/movie/MoviesSlider'


export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: newMovies } = await supabase
    .from('content')
    .select('id, title, poster_url, rating, type, release_year')
    .eq('type', 'movie')
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: newSeries } = await supabase
    .from('content')
    .select('id, title, poster_url, rating, type, release_year')
    .eq('type', 'series')
    .order('created_at', { ascending: false })
    .limit(20)

  const formatMovies = (movies: any[] | null) => 
    movies?.map(m => ({
      id: m.id,
      title: m.title,
      posterUrl: m.poster_url,
      kinopoiskRating: m.rating,
      customRating: null,
      type: m.type,
      releaseYear: m.release_year,
    })) || []

    

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100">
      {user ? <AuthHeader /> : <GuestHeader />}
      
      <div className="container mx-auto px-4 py-8 space-y-12">
        <MoviesSlider title="🎬 Новинки фильмов" movies={formatMovies(newMovies)} />
        <MoviesSlider title="📺 Новинки сериалов" movies={formatMovies(newSeries)} />
      </div>
    </main>
  )
}