// src/components/profile/tabs/PostsTab.tsx
'use client'

import { useState, useEffect } from 'react'
import { Send, Loader2, Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import PostCardWrapper from './PostCardWrapper';
import Link from 'next/link'

interface PostType {
  id: number
  body: string
  likes_count: number
  comments_count: number
  created_at: string
  user_id: string
  profiles?: { username: string; avatar_url: string | null } | null
}

interface PostsTabProps {
  userId: string
  posts: PostType[]
  currentUser: User | null
  onPostCreated: () => void
}

export function PostsTab({ userId, posts, currentUser, onPostCreated }: PostsTabProps) {
  const [postText, setPostText] = useState('')
  const [loading, setLoading] = useState(false)
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())
  const supabase = createClient()

  // 🔥 Загрузка лайков при загрузке вкладки
  useEffect(() => {
    if (!currentUser) return
    
    const loadLikes = async () => {
      const postIds = posts.map(p => p.id)
      if (postIds.length === 0) return

      const { data } = await supabase
        .from('votes')
        .select('post_id')
        .in('post_id', postIds)
        .eq('user_id', currentUser.id)
        .eq('value', 1)
      
      const liked = new Set(data?.map(d => d.post_id) || [])
      setLikedPosts(liked)
    }
    
    loadLikes()
  }, [currentUser, posts, supabase])

  // 🔥 Создание поста
  // 🔥 Создание поста
const handleCreatePost = async () => {
  if (!postText.trim() || !currentUser) return;

  setLoading(true);

  try {
    const { data, error } = await supabase  // используем уже созданный supabase сверху
      .from('posts')
      .insert({
        user_id: currentUser.id,
        body: postText.trim(),
      })
      .select(`
        id, 
        body, 
        likes_count, 
        comments_count, 
        created_at, 
        user_id,
        profiles:user_id (username, avatar_url)
      `)
      .single();

    if (error) throw error;

    if (data) {
      onPostCreated();        // ← обновляем данные в родителе
      setPostText('');
    }
  } catch (error) {
    console.error('Ошибка создания поста:', error);
    alert('Не удалось создать пост');
  } finally {
    setLoading(false);
  }
};

  // 🔥 Лайк поста
  const handleLike = async (postId: number) => {
    if (!currentUser) return alert('Войдите, чтобы ставить лайки')
    
    const isLiked = likedPosts.has(postId)
    
    try {
      if (isLiked) {
        // Удаляем лайк
        const { error } = await supabase
          .from('votes')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('post_id', postId)
        
        if (!error) {
          setLikedPosts(prev => {
            const next = new Set(prev)
            next.delete(postId)
            return next
          })
        }
      } else {
        // Ставим лайк
        const { error } = await supabase
          .from('votes')
          .insert({
            user_id: currentUser.id,
            post_id: postId,
            value: 1
          })
        
        if (!error) {
          setLikedPosts(prev => new Set(prev).add(postId))
        }
        
      }
    } catch (err) {
      console.error('Like error:', err)
    }
  }

  // 🔥 Проверяем, владелец ли это профиля
  const isOwner = currentUser?.id === userId

  return (
  <div className="space-y-6">
    {/* Поле создания поста */}
    {isOwner && currentUser && (
      <div className="bg-[#121216] rounded-[20px] p-5">
        <textarea
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
          placeholder="Напишите о чём думаете..."
          className="w-full bg-[#09090b] rounded-[10px] p-4 text-white placeholder-zinc-500 resize-none h-[60px] focus:outline-none focus:ring-2 focus:ring-purple-600 text-[18px]"
          disabled={loading}
        />
        <div className="flex justify-end mt-3">
          <button 
            onClick={handleCreatePost}
            disabled={loading || !postText.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-[10px] text-[16px] font-medium text-white transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} 
            Опубликовать
          </button>
        </div>
      </div>
    )}

    {/* Список постов */}
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCardWrapper 
          key={post.id} 
          post={post} 
          isLiked={likedPosts.has(post.id)} 
          onLike={() => handleLike(post.id)} 
        />
      ))}

      {posts.length === 0 && (
        <div className="text-center py-12 text-zinc-500 bg-[#121216] rounded-[20px]">
          {isOwner ? 'Пока нет постов. Напишите первый!' : 'У пользователя пока нет постов.'}
        </div>
      )}
    </div>
  </div>
);
}