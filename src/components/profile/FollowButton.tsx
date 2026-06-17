'use client';

import { useState, useTransition } from 'react';
import { toggleFollow } from '@/app/actions/subscriptions';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';

interface FollowButtonProps {
  followingId: string;
  initialIsFollowing: boolean;
}

export default function FollowButton({ followingId, initialIsFollowing }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      try {
        const result = await toggleFollow(followingId);
        setIsFollowing(result.isFollowing);
      } catch (error: any) {
        alert(error.message || 'Произошла ошибка');
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`
        flex items-center gap-2 px-6 py-2.5 rounded-[20px] font-medium transition-all
        ${isFollowing 
          ? 'bg-transparent border border-zinc-700 hover:bg-zinc-900 text-white' 
          : 'bg-purple-600 hover:bg-purple-700 text-white'
        }
      `}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck className="w-4 h-4" />
          Подписан
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          Подписаться
        </>
      )}
    </button>
  );
}