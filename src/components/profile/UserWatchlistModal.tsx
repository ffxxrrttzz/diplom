'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { X, PlayCircle, Clock, Heart } from 'lucide-react';

interface UserWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  status: 'watching' | 'watched' | 'planned';
  title: string;
}

interface Content {
  id: number;
  title: string;
  poster_url: string | null;
  type: string;
}

interface WatchlistItem {
  content: Content;
}

export default function UserWatchlistModal({ 
  isOpen, 
  onClose, 
  userId, 
  status, 
  title 
}: UserWatchlistModalProps) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchWatchlist = async () => {
      const supabase = createClient();
      setLoading(true);

      const { data, error } = await supabase
        .from('user_content_status')
        .select(`
          content (
            id,
            title,
            poster_url,
            type
          )
        `)
        .eq('user_id', userId)
        .eq('status', status)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching watchlist:', error);
        setItems([]);
      } else {
        // Безопасное приведение типа
        setItems(data as unknown as WatchlistItem[]);
      }
      setLoading(false);
    };

    fetchWatchlist();
  }, [isOpen, userId, status]);

  if (!isOpen) return null;

  const statusIcons: Record<string, React.ReactNode> = {
    watching: <PlayCircle className="w-5 h-5" />,
    watched: <Heart className="w-5 h-5" />,
    planned: <Clock className="w-5 h-5" />,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#121216] w-full max-w-2xl mx-4 rounded-3xl overflow-hidden border border-zinc-800">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            {statusIcons[status]}
            <h2 className="text-2xl font-bold">{title}</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-zinc-700 border-t-purple-500 rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              Здесь пока пусто
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {items.map((item, index) => (
                <Link
                  key={index}
                  href={`/movie/${item.content.id}`}
                  onClick={onClose}
                  className="group"
                >
                  <div className="aspect-[2/3] rounded-2xl overflow-hidden border border-zinc-700 group-hover:border-purple-500 transition-all">
                    {item.content.poster_url ? (
                      <img
                        src={item.content.poster_url}
                        alt={item.content.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-4xl">
                        🎬
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-sm font-medium line-clamp-2 group-hover:text-purple-400 transition-colors">
                    {item.content.title}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}