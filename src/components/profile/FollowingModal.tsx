'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { X } from 'lucide-react';

interface FollowingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
}

interface FollowingUser {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
}

export default function FollowingModal({ isOpen, onClose, userId, username }: FollowingModalProps) {
  const [following, setFollowing] = useState<FollowingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchFollowing() {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select(`
          following:profiles!subscriptions_following_id_fkey (
            id,
            username,
            avatar_url,
            bio
          )
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error(fetchError);
        setError('Не удалось загрузить подписки');
      } else {
        setFollowing(data?.map((item: any) => item.following) || []);
      }
      setLoading(false);
    }

    fetchFollowing();
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#121216] w-full max-w-lg mx-4 rounded-3xl overflow-hidden border border-zinc-800">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-2xl font-bold">Подписки @{username}</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-zinc-700 border-t-purple-500 rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400">{error}</div>
          ) : following.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              Пока нет подписок
            </div>
          ) : (
            <div className="space-y-3">
              {following.map((user) => (
                <Link
                  key={user.id}
                  href={`/profile/${user.id}`}
                  onClick={onClose}
                  className="flex items-center gap-4 p-4 hover:bg-zinc-900 rounded-2xl transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-zinc-700 flex-shrink-0">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-2xl">
                        👤
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-lg group-hover:text-purple-400 transition-colors">
                      @{user.username}
                    </p>
                    {user.bio && (
                      <p className="text-sm text-zinc-400 line-clamp-2 mt-0.5">
                        {user.bio}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}