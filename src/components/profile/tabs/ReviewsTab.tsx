'use client'

import { Heart, Star, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface ReviewType {
  id: number
  title?: string | null
  text: string
  rating?: number | null
  created_at: string
  likes_count: number
  content_id: number
  user_id: string
  content?: {
    title: string
    poster_url: string | null
  } | null
}

interface ReviewsTabProps {
  reviews: ReviewType[]
  currentUser: User | null
}

export function ReviewsTab({ reviews: initialReviews, currentUser }: ReviewsTabProps) {
  const supabase = createClient()
  const [reviews, setReviews] = useState<ReviewType[]>(initialReviews)
  const [liked, setLiked] = useState<Set<number>>(new Set())

  // Инициализация состояния лайков при загрузке
  useEffect(() => {
    console.log('Reviews loaded in tab:', reviews.length)
  }, [reviews])

  // Простая проверка уже поставленных лайков (опционально можно улучшить позже)
  useEffect(() => {
    if (!currentUser || reviews.length === 0) return

    const checkLikes = async () => {
      const reviewIds = reviews.map(r => r.id)
      
      const { data } = await supabase
        .from('votes')
        .select('review_id')
        .in('review_id', reviewIds)
        .eq('user_id', currentUser.id)

      if (data) {
        const likedIds = new Set(data.map(v => v.review_id))
        setLiked(likedIds)
      }
    }

    checkLikes()
  }, [currentUser, reviews, supabase])

  const toggleLike = async (reviewId: number) => {
    if (!currentUser) return alert('Войдите, чтобы ставить лайки')

    const isCurrentlyLiked = liked.has(reviewId)

    try {
      if (isCurrentlyLiked) {
        // Удаляем лайк
        const { error } = await supabase
          .from('votes')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('review_id', reviewId)

        if (error) throw error

        setLiked(prev => {
          const n = new Set(prev)
          n.delete(reviewId)
          return n
        })
      } else {
        // Добавляем лайк
        const { error } = await supabase
          .from('votes')
          .insert({
            user_id: currentUser.id,
            review_id: reviewId,
            value: 1
          })

        if (error) throw error

        setLiked(prev => new Set(prev).add(reviewId))
      }
    } catch (error: any) {
      console.error('Like error:', error)
      
      if (error.code === '23505' || error.message?.includes('409')) {
        // Если конфликт — значит лайк уже существует, просто обновляем локальное состояние
        setLiked(prev => new Set(prev).add(reviewId))
      } else {
        alert('Не удалось поставить лайк. Попробуйте ещё раз.')
      }
    }
  }

  return (
    <div className="space-y-4">
      {reviews.length > 0 ? (
        reviews.map((review) => {
          const isLiked = liked.has(review.id)
          const rating = review.rating ?? 0

          return (
            <div key={review.id} className="bg-[#121216] rounded-[20px] p-5 space-y-4">
              <div className="flex items-start gap-4">
                <Link 
                  href={`/movie/${review.content_id}`}
                  className="flex-shrink-0"
                >
                  <div className="w-[72px] h-[100px] rounded-[12px] bg-zinc-800 overflow-hidden border border-zinc-700">
                    {review.content?.poster_url ? (
                      <img 
                        src={review.content.poster_url} 
                        alt={review.content.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl bg-zinc-900">
                        🎬
                      </div>
                    )}
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <Link 
                      href={`/movie/${review.content_id}`}
                      className="text-[20px] font-medium text-white hover:text-purple-400 line-clamp-1"
                    >
                      {review.content?.title || 'Неизвестный контент'}
                    </Link>
                    <span className="text-sm text-zinc-500 whitespace-nowrap ml-3">
                      {new Date(review.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>

                  {rating > 0 && (
                    <div className="flex items-center gap-1 text-[#ffd700] text-xl font-bold mb-2">
                      <Star className="w-5 h-5 fill-current" />
                      {rating.toFixed(1)}
                    </div>
                  )}

                  {review.title && (
                    <h3 className="text-[22px] font-semibold text-white mb-2">
                      {review.title}
                    </h3>
                  )}
                </div>
              </div>

              <p className="text-[18px] text-zinc-300 leading-relaxed line-clamp-4">
                {review.text}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                <button
                  onClick={() => toggleLike(review.id)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-[20px] text-sm transition-colors ${
                    isLiked 
                      ? 'text-purple-500 bg-purple-950/50' 
                      : 'text-zinc-400 hover:text-purple-400'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  {(review.likes_count || 0) + (isLiked ? 1 : 0)}
                </button>

                <Link 
                  href={`/movie/${review.content_id}`}
                  className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 rounded-[20px] text-white text-sm font-medium"
                >
                  Перейти к контенту <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )
        })
      ) : (
        <div className="text-center py-16 text-zinc-500 bg-[#121216] rounded-[20px]">
          <p className="text-xl mb-2">Пока нет рецензий</p>
          <p className="text-sm">Напишите свою первую рецензию на странице фильма</p>
        </div>
      )}
    </div>
  )
}