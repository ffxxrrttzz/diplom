'use client'

import { Heart, ArrowRight, UserPlus, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface ThreadType {
  id: number
  title: string
  content: string
  likes_count: number
  created_at: string
  user_id: string
  profiles?: { username: string; avatar_url: string | null }[] | null
}

interface ThreadsTabProps {
  threads: ThreadType[]
  currentUser: User | null
}

export function ThreadsTab({ threads: initialThreads, currentUser }: ThreadsTabProps) {
  const supabase = createClient()
  const [threads] = useState(initialThreads)
  const [liked, setLiked] = useState<Set<number>>(new Set())
  const [subscribed, setSubscribed] = useState<Set<string>>(new Set())

  const toggleLike = async (threadId: number) => {
    if (!currentUser) return alert('Войдите, чтобы ставить лайки')

    const isCurrentlyLiked = liked.has(threadId)

    if (isCurrentlyLiked) {
      await supabase.from('votes').delete().eq('user_id', currentUser.id).eq('thread_id', threadId)
      setLiked(prev => { const n = new Set(prev); n.delete(threadId); return n })
    } else {
      await supabase.from('votes').insert({ user_id: currentUser.id, thread_id: threadId, value: 1 })
      setLiked(prev => new Set(prev).add(threadId))
    }
  }

  const toggleSubscribe = async (followingId: string) => {
    if (!currentUser || followingId === currentUser.id) return

    const isSubscribedNow = subscribed.has(followingId)

    if (isSubscribedNow) {
      await supabase.from('subscriptions').delete()
        .eq('follower_id', currentUser.id).eq('following_id', followingId)
      setSubscribed(prev => { const n = new Set(prev); n.delete(followingId); return n })
    } else {
      await supabase.from('subscriptions').insert({
        follower_id: currentUser.id,
        following_id: followingId
      })
      setSubscribed(prev => new Set(prev).add(followingId))
    }
  }

  return (
    <div className="space-y-4">
      {threads.map((thread) => {
        const profile = thread.profiles?.[0]
        const isLiked = liked.has(thread.id)
        const isSubscribed = subscribed.has(thread.user_id)

        return (
          <div key={thread.id} className="bg-[#121216] rounded-[20px] p-5 space-y-3">
            <div className="flex justify-between items-start">
              <Link href={`/threads/${thread.id}`} className="text-[22px] font-medium hover:text-purple-400">
                {thread.title}
              </Link>
              <span className="text-sm text-zinc-500">
                {new Date(thread.created_at).toLocaleDateString('ru-RU')}
              </span>
            </div>

            <p className="text-[18px] text-zinc-300 line-clamp-3">{thread.content}</p>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <div className="flex items-center gap-4">
                {/* <button
                  onClick={() => toggleLike(thread.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-[20px] text-sm ${isLiked ? 'text-purple-500' : 'text-zinc-400 hover:text-purple-400'}`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  {(thread.likes_count || 0) + (isLiked ? 1 : 0)}
                </button> */}

                {currentUser && currentUser.id !== thread.user_id && (
                  <button
                    onClick={() => toggleSubscribe(thread.user_id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-[20px] text-sm ${isSubscribed ? 'bg-zinc-700 text-zinc-300' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                  >
                    {isSubscribed ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {isSubscribed ? 'Подписан' : 'Подписаться'}
                  </button>
                )}
              </div>

              <Link href={`/threads/${thread.id}`} className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 rounded-[20px] text-white">
                Перейти <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )
      })}

      {threads.length === 0 && (
        <div className="text-center py-12 text-zinc-500 bg-[#121216] rounded-[20px]">
          Пока нет тредов
        </div>
      )}
    </div>
  )
}