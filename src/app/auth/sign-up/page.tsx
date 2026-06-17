'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GuestHeader } from '@/components/layout/GuestHeader'
import { createClient } from '@/lib/supabase/client'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }
    if (!agreeTerms) {
      setError('Необходимо принять условия использования')
      return
    }
    
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: nickname } } // Сохраняем ник в метаданных
    })

    if (error) {
      setError(error.message)
    } else {
      setError('Регистрация успешна! Проверьте почту или войдите в аккаунт.')
      setTimeout(() => router.push('/auth/sign-in'), 2000)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col">
      <GuestHeader />
      
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-[876px] bg-[#121216] rounded-[20px] p-8 md:p-12 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-[48px] font-medium text-[#d9d9d9]">Регистрация</h1>
            <p className="text-[24px] text-[#8f8f8f]">Создайте аккаунт для доступа ко всем функциям</p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-6 max-w-[503px] mx-auto">
            {error && <p className="text-red-500 text-center text-lg font-medium">{error}</p>}

            <div className="space-y-2">
              <label className="text-[24px] font-medium text-[#d9d9d9] block">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Ваш email" className="w-full h-[54px] bg-[#09090b] rounded-[10px] px-5 text-[20px] text-white placeholder-[#878787] focus:outline-none focus:ring-2 focus:ring-[#720e9c] transition-all" required />
            </div>

            <div className="space-y-2">
              <label className="text-[24px] font-medium text-[#d9d9d9] block">Отображаемое имя</label>
              <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Ваш nickname" className="w-full h-[54px] bg-[#09090b] rounded-[10px] px-5 text-[20px] text-white placeholder-[#878787] focus:outline-none focus:ring-2 focus:ring-[#720e9c] transition-all" required />
            </div>

            <div className="space-y-2">
              <label className="text-[24px] font-medium text-[#d9d9d9] block">Пароль</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ваш пароль" className="w-full h-[54px] bg-[#09090b] rounded-[10px] px-5 text-[20px] text-white placeholder-[#878787] focus:outline-none focus:ring-2 focus:ring-[#720e9c] transition-all" required minLength={6} />
            </div>

            <div className="space-y-2">
              <label className="text-[24px] font-medium text-[#d9d9d9] block">Подтвердите пароль</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Повторите пароль" className="w-full h-[54px] bg-[#09090b] rounded-[10px] px-5 text-[20px] text-white placeholder-[#878787] focus:outline-none focus:ring-2 focus:ring-[#720e9c] transition-all" required minLength={6} />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input type="checkbox" id="terms" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="w-6 h-6 rounded border-zinc-600 bg-[#09090b] text-[#720e9c] focus:ring-[#720e9c] cursor-pointer" />
              <label htmlFor="terms" className="text-[20px] text-white cursor-pointer select-none">Принимаю условия пользования платформой</label>
            </div>

            <div className="space-y-4 pt-4">
              <button type="submit" disabled={loading} className="w-full h-[54px] bg-[#d9d9d9] hover:bg-[#c0c0c0] text-[#000000] rounded-[10px] text-[24px] font-medium transition-colors disabled:opacity-50">
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>
              <Link href="/auth/sign-in" className="w-full h-[54px] bg-[#09090b] border-2 border-[#d9d9d9] hover:bg-zinc-800 text-[#d9d9d9] rounded-[10px] text-[24px] font-medium flex items-center justify-center transition-colors">
                Уже есть аккаунт? Войти
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}