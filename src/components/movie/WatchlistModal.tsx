'use client';

import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';

interface WatchlistModalProps {
  contentId: number;
  onClose: () => void;
}

export function WatchlistModal({ contentId, onClose }: WatchlistModalProps) {
  const { user } = useAuthStore();
  const supabase = createClient();

  const addToList = async (status: string) => {
    if (!user) return;
    await supabase.from('user_content_status').upsert({
      user_id: user.id,
      content_id: contentId,
      status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 w-full max-w-md">
        <h2 className="text-2xl text-[#d9d9d9] font-bold mb-6 text-center">Добавить в список</h2>
        
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => addToList('watching')} className="py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-[#d9d9d9] cursor-pointer">Смотрю</button>
          <button onClick={() => addToList('watched')} className="py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-[#d9d9d9] cursor-pointer">Просмотрено</button>
          <button onClick={() => addToList('planned')} className="py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-[#d9d9d9] cursor-pointer">В планах</button>
        </div>

        <button onClick={onClose} className="w-full mt-6 py-4 text-zinc-400 hover:text-white cursor-pointer">
          Закрыть
        </button>
      </div>
    </div>
  );
}