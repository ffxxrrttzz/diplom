// src/app/profile/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { ProfileClient } from '@/components/profile/ProfileClient'
import { AuthHeader } from '@/components/layout/AuthHeader'

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  
  // Загружаем профиль по id (UUID)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (profileError || !profile) {
    return (
      <main className="min-h-screen bg-[#09090b] flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Профиль не найден</h1>
          <a href="/" className="text-purple-400 hover:underline">Вернуться на главную</a>
        </div>
      </main>
    )
  }

  const userId = profile.id

  // Посты
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      id, body, likes_count, comments_count, created_at, user_id,
      profiles:user_id (username, avatar_url)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  // Рецензии
  const { data: reviews } = await supabase
  .from('reviews')
  .select(`
    id,
    title,
    text,
    rating,
    created_at,
    likes_count,
    content_id,
    user_id,
    content (
      title,
      poster_url
    )
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(20)

  // Оценки
  const { data: ratings } = await supabase
    .from('user_ratings')
    .select(`
      id, rating, created_at, content_id,
      content (title, poster_url, type)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  // Треды
  const { data: threads } = await supabase
    .from('threads')
    .select(`
      id, title, content, likes_count, created_at, user_id,
      profiles:user_id (username, avatar_url)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  // Статистика подписок
  const { count: followersCount } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId)

  const { count: followingCount } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId)

  let isFollowing = false
  if (currentUser) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('follower_id', currentUser.id)
      .eq('following_id', userId)
      .maybeSingle()
    isFollowing = !!sub
  }

  const data = {
    stats: {
      followers: followersCount || 0,
      following: followingCount || 0,
      isFollowing,
      watching: 0,
      watched: 0,
      plan: 0,
    },
    posts: posts || [],
    reviews: reviews || [],
    ratings: ratings || [],
    threads: threads || [],
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-white pb-20">
      <AuthHeader />
      <ProfileClient 
        profile={profile} 
        data={data} 
        currentUser={currentUser} 
      />
    </main>
  )
}