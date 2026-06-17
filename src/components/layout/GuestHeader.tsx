// src/components/layout/GuestHeader.tsx
import Link from 'next/link'
import { Logo } from '@/components/layout/logo'
import { Search } from 'lucide-react' // Иконка поиска (нужна библиотека lucide-react)
import { SearchBar } from '@/components/search/SearchBar'

export function GuestHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/50 bg-[#131316] backdrop-blur-md">
      <div className="container mx-auto px-4 h-[70px] flex items-center justify-between">
        
        {/* 1. Логотип (Слева) */}
        
        <div className="w-[144px] h-[52px] flex-shrink-0 overflow-hidden">
            <a href="/" className="flex-shrink-0 w-[144px] h-[52px] flex items-center">
                <Logo /> {/* <-- Вставляем твой компонент сюда */}
            </a>
        </div>

        {/* 2. Поиск (По центру) */}
        <div className="container mx-auto px-4 py-6">
          <SearchBar />
        </div>

        {/* 3. Кнопки (Справа) */}
        <div className="flex items-center gap-3">
          {/* Кнопка "Вход" */}
          <Link 
            href="/auth/sign-in" 
            className="px-6 py-2 h-[39px] flex items-center justify-center bg-[#09090b] rounded-[20px] text-sm font-medium text-white hover:bg-zinc-800 transition-colors border border-zinc-800"
          >
            Вход
          </Link>
          
          {/* Кнопка "Регистрация" */}
          <Link 
            href="/auth/sign-up" 
            className="px-7 py-2 h-[39px] flex items-center justify-center bg-purple-600 rounded-[20px] text-sm font-medium text-white hover:bg-purple-700 transition-colors shadow-[0_4px_15px_rgba(114,14,156,0.3)]"
          >
            Регистрация
          </Link>
        </div>

      </div>
    </header>
  )
}