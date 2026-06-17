'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client'; // или твой путь
import { Shield } from 'lucide-react';
import { SearchBar } from '../search/SearchBar';
import { Logo } from '@/components/layout/logo'

export default function Header() {
  const [isAdminUser, setIsAdminUser] = useState(false);
  const supabase = createClient();

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

  return (
    <header className="border-b border-gray-800 bg-black/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
            <a href="/" className="flex-shrink-0 w-[144px] h-[52px] flex items-center">
                <Logo /> {/* <-- Вставляем твой компонент сюда */}
            </a>
          <SearchBar />
        </div>

        <nav className="flex items-center gap-6">
          {isAdminUser && (
            <Link 
              href="/admin" 
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 transition-all font-medium"
            >
              <Shield size={18} />
              Админка
            </Link>
          )}
          
        </nav>

        
      </div>
    </header>
  );
}