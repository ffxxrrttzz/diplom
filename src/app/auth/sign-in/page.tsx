'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GuestHeader } from '@/components/layout/GuestHeader'
import { createClient } from '@/lib/supabase/client'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Неверный email или пароль' : error.message)
    } else {
      router.push('/') 
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col">
      <GuestHeader />
      
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-[876px] bg-[#121216] rounded-[20px] p-8 md:p-12 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-[48px] font-medium text-[#d9d9d9]">Вход</h1>
            <p className="text-[24px] text-[#8f8f8f]">Введите свои данные для входа в аккаунт</p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-6 max-w-[503px] mx-auto">
            {error && <p className="text-red-500 text-center text-lg font-medium">{error}</p>}

            <div className="space-y-2">
              <label className="text-[24px] font-medium text-[#d9d9d9] block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ваш email"
                className="w-full h-[54px] bg-[#09090b] rounded-[10px] px-5 text-[20px] text-white placeholder-[#878787] focus:outline-none focus:ring-2 focus:ring-[#720e9c] transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[24px] font-medium text-[#d9d9d9]">Пароль</label>
                <Link href="/auth/forgot-password" className="text-[20px] text-[#878787] hover:text-white transition-colors">
                  Забыли пароль?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ваш пароль"
                className="w-full h-[54px] bg-[#09090b] rounded-[10px] px-5 text-[20px] text-white placeholder-[#878787] focus:outline-none focus:ring-2 focus:ring-[#720e9c] transition-all"
                required
              />
            </div>

            <div className="space-y-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[54px] bg-[#d9d9d9] hover:bg-[#c0c0c0] text-[#000000] rounded-[10px] text-[24px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Вход...' : 'Войти'}
              </button>
              
              <Link
                href="/auth/sign-up"
                className="w-full h-[54px] bg-[#09090b] border-2 border-[#d9d9d9] hover:bg-zinc-800 text-[#d9d9d9] rounded-[10px] text-[24px] font-medium flex items-center justify-center transition-colors"
              >
                Регистрация
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}