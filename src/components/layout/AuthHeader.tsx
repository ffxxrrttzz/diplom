// src/components/layout/AuthHeader.tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Search, LogOut, User as UserIcon } from 'lucide-react'
import { Logo } from '@/components/layout/logo'
import { SearchBar } from '@/components/search/SearchBar'
import { createClient } from '@/lib/supabase/client'
import { Shield } from 'lucide-react';

const supabase = createClient()

export function AuthHeader() {
  const [isAdminUser, setIsAdminUser] = useState(false);
  const router = useRouter()
  const [userName, setUserName] = useState('Пользователь')
  const [userId, setUserId] = useState<string | null>(null)
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    const fetchUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error || !session?.user) {
          setLoading(false)
          return
        }
        
        const user = session.user
        
        // 🔥 Загружаем профиль с аватаркой
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', user.id)
          .single()
        
        setUserId(user.id)
        setUserName(profile?.username || user.email?.split('@')[0] || 'Пользователь')
        setUserAvatar(profile?.avatar_url || null)
      } catch (err) {
        console.error('Auth error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      setIsAdminUser(profile?.role === 'admin');
    };

    checkAdmin();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUserId(null)
    setUserName('Пользователь')
    setUserAvatar(null)
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full h-[70px] bg-[#131316] border-b border-zinc-800/50">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <div className="w-[144px] h-[52px] flex-shrink-0 overflow-hidden">
                    <a href="/" className="flex-shrink-0 w-[144px] h-[52px] flex items-center">
                        <Logo /> 
                    </a>
                </div>

        <div className="container mx-auto px-4 py-6">
                  <SearchBar />
        </div>

        

        <div className="flex items-center gap-4">
          {isAdminUser && (
            <Link 
              href="/admin" 
              className="flex items-center gap-1 px-6 py-1 rounded-xl bg-violet-600 hover:bg-violet-700 transition-all font-medium text-sm text-[#d9d9d9]"
            >
              <Shield size={24} />
              Админка
            </Link>
          )}
          <Link 
            href={`/profile/${userId}`} 
            className="w-[50px] h-[50px] rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center border-2 border-zinc-700 hover:border-purple-500 transition-colors flex-shrink-0"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
            ) : userAvatar ? (
              <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-6 h-6 text-zinc-400" />
            )}
          </Link>
          
          <span className="text-sm font-medium text-white hidden sm:block truncate max-w-[120px]">
            {loading ? 'Загрузка...' : userName}
          </span>
          
          <button onClick={handleLogout} disabled={loading} className="flex items-center gap-2 px-4 py-2 h-[39px] bg-[#09090b] rounded-[20px] text-sm font-medium text-white hover:bg-zinc-800 transition-colors border border-zinc-800 disabled:opacity-50">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Выйти</span>
          </button>
        </div>
      </div>
    </header>
  )
}