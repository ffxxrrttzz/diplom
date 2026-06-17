// src/app/profile/edit/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthHeader } from '@/components/layout/AuthHeader'
import { createClient } from '@/lib/supabase/client'
import { Upload, Loader2, Check, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null)
  const [previewBanner, setPreviewBanner] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    username: '',
    telegram_link: '',
    currentEmail: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          router.push('/auth/sign-in')
          return
        }
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('username, telegram_link, avatar_url, banner_url, email')
          .eq('id', user.id)
          .single()
        
        if (profileError) {
          console.error('Profile fetch error:', profileError)
          return
        }
        
        if (profile) {
          setFormData({
            username: profile.username || '',
            telegram_link: profile.telegram_link || '',
            currentEmail: profile.email || user.email || '',
            newPassword: '',
            confirmPassword: ''
          })
          setPreviewAvatar(profile.avatar_url)
          setPreviewBanner(profile.banner_url)
        }
      } catch (err) {
        console.error('Unexpected error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [router, supabase])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0]
    if (file) {
      if (type === 'avatar') {
        setAvatarFile(file)
        setPreviewAvatar(URL.createObjectURL(file))
      } else {
        setBannerFile(file)
        setPreviewBanner(URL.createObjectURL(file))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Не авторизован')

      let avatarUrl = previewAvatar
      let bannerUrl = previewBanner

      // 🔥 Загрузка аватара (исправленная деструктуризация)
if (avatarFile) {
  try {
    const ext = avatarFile.name.split('.').pop()
    const filePath = `${user.id}/avatar.${ext}`
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile, { upsert: true, cacheControl: '3600' })
    
    if (uploadError) throw uploadError
    
    // ✅ ПРАВИЛЬНАЯ деструктуризация: { data: { publicUrl } }
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)
    
    avatarUrl = publicUrl
  } catch (err: any) {
    console.error('Avatar upload error:', err)
    throw new Error(`Не удалось загрузить аватар: ${err.message}`)
  }
}

// 🔥 Загрузка фона (исправленная деструктуризация)
if (bannerFile) {
  try {
    const ext = bannerFile.name.split('.').pop()
    const filePath = `${user.id}/banner.${ext}`
    
    const { error: uploadError } = await supabase.storage
      .from('banners')
      .upload(filePath, bannerFile, { upsert: true, cacheControl: '3600' })
    
    if (uploadError) throw uploadError
    
    // ✅ ПРАВИЛЬНАЯ деструктуризация: { data: { publicUrl } }
    const { data: { publicUrl } } = supabase.storage
      .from('banners')
      .getPublicUrl(filePath)
    
    bannerUrl = publicUrl
  } catch (err: any) {
    console.error('Banner upload error:', err)
    throw new Error(`Не удалось загрузить фон: ${err.message}`)
  }
}

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          telegram_link: formData.telegram_link,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('Пароли не совпадают')
        }
        await supabase.auth.updateUser({ password: formData.newPassword })
      }

      setMessage({ type: 'success', text: 'Профиль успешно обновлён!' })
      setTimeout(() => router.push(`/profile/${user.id}`), 1500)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Ошибка при сохранении' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#09090b] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-white pb-20">
      <AuthHeader />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> На главную
        </Link>
        
        <h1 className="text-[32px] font-medium text-white mb-8 text-center">Редактировать профиль</h1>
        
        <form onSubmit={handleSubmit} className="bg-[#121216] rounded-[20px] p-6 md:p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[20px] font-medium text-white">Имя пользователя</label>
            <input 
              type="text" 
              value={formData.username} 
              onChange={e => setFormData({...formData, username: e.target.value})} 
              className="w-full h-[60px] bg-[#09090b] rounded-[10px] px-5 text-[20px] text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-600" 
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[20px] font-medium text-white">Email</label>
            <input 
              type="email" 
              value={formData.currentEmail} 
              disabled 
              className="w-full h-[60px] bg-[#09090b]/50 rounded-[10px] px-5 text-[20px] text-zinc-400 cursor-not-allowed" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[20px] font-medium text-white">Аватар профиля</label>
              <label className="relative h-[160px] bg-[#09090b] rounded-[10px] overflow-hidden flex items-center justify-center border-2 border-dashed border-zinc-700 hover:border-purple-500 cursor-pointer">
                {previewAvatar ? (
                  <img src={previewAvatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-8 h-8 text-zinc-500" />
                )}
                <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'avatar')} className="hidden" />
              </label>
            </div>
            <div className="space-y-2">
              <label className="text-[20px] font-medium text-white">Фон профиля</label>
              <label className="relative h-[160px] bg-[#09090b] rounded-[10px] overflow-hidden flex items-center justify-center border-2 border-dashed border-zinc-700 hover:border-purple-500 cursor-pointer">
                {previewBanner ? (
                  <img src={previewBanner} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-8 h-8 text-zinc-500" />
                )}
                <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'banner')} className="hidden" />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[20px] font-medium text-white">Ссылка на телеграм</label>
            <input 
              type="url" 
              value={formData.telegram_link} 
              onChange={e => setFormData({...formData, telegram_link: e.target.value})} 
              placeholder="https://t.me/username" 
              className="w-full h-[60px] bg-[#09090b] rounded-[10px] px-5 text-[20px] text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-600" 
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-zinc-800">
            <h3 className="text-[20px] font-medium text-white">Смена пароля</h3>
            <input 
              type="password" 
              value={formData.newPassword} 
              onChange={e => setFormData({...formData, newPassword: e.target.value})} 
              placeholder="Новый пароль" 
              className="w-full h-[60px] bg-[#09090b] rounded-[10px] px-5 text-[20px] text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-600" 
            />
            <input 
              type="password" 
              value={formData.confirmPassword} 
              onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
              placeholder="Повторите пароль" 
              className="w-full h-[60px] bg-[#09090b] rounded-[10px] px-5 text-[20px] text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-600" 
            />
          </div>

          {message && (
            <div className={`p-4 rounded-[10px] text-center text-lg font-medium ${
              message.type === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
            }`}>
              {message.text}
            </div>
          )}

          <button 
            type="submit" 
            disabled={saving} 
            className="w-full h-[60px] bg-[#d9d9d9] hover:bg-[#c0c0c0] text-[#09090b] rounded-[10px] text-[24px] font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />}
            Готово
          </button>
        </form>
      </div>
    </main>
  )
}