'use client'

import Link from 'next/link';
import { User, Edit } from 'lucide-react';
import type { User as UserType } from '@supabase/supabase-js';
import FollowButton from './FollowButton';

interface ProfileHeaderProps {
  profile: any;
  stats: any;
  currentUser?: UserType | null;
  onFollowersClick: () => void;
  onFollowingClick: () => void;
  onWatchingClick?: () => void;
  onWatchedClick?: () => void;
  onPlannedClick?: () => void;
}

export function ProfileHeader({ 
  profile, 
  stats, 
  currentUser,
  onFollowersClick,
  onFollowingClick,
  onWatchingClick,
  onWatchedClick,
  onPlannedClick 
}: ProfileHeaderProps) {
  const isOwner = currentUser?.id === profile.id;

  return (
    <div className="relative">
      <div className="h-[333px] lg:h-[400px] rounded-[20px] overflow-hidden bg-zinc-800 relative">
        {profile.banner_url ? (
          <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-zinc-900" />
        )}
      </div>

      <div className="relative -mt-20 px-4 lg:px-8">
        <div className="bg-[#121216] rounded-[20px] p-6 flex flex-col lg:flex-row items-start lg:items-center gap-6">
          <div className="w-[150px] h-[150px] rounded-full bg-zinc-700 overflow-hidden border-4 border-[#121216] flex-shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400">
                <User className="w-16 h-16" />
              </div>
            )}
          </div>

          <div className="flex-1 w-full">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-[32px] font-bold text-white mb-1">{profile.username}</h1>
                {profile.bio && <p className="text-[16px] text-zinc-400 max-w-2xl">{profile.bio}</p>}
              </div>

              <div className="flex items-center gap-3 self-start lg:self-auto">
                {!isOwner && (
                  <FollowButton 
                    followingId={profile.id} 
                    initialIsFollowing={stats.isFollowing || false} 
                  />
                )}
                {isOwner && (
                  <Link 
                    href="/profile/edit"
                    className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-[20px] text-[16px] font-medium text-white transition-colors"
                  >
                    <Edit className="w-4 h-4" /> Редактировать
                  </Link>
                )}
              </div>
            </div>

            {/* Статистика */}
            <div className="flex flex-wrap gap-6 border-t border-zinc-800 pt-4">
              <div 
                className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={onFollowersClick}
              >
                <div className="text-[24px] font-bold text-white">{stats.followers || 0}</div>
                <div className="text-[14px] text-zinc-400">Подписчиков</div>
              </div>

              <div 
                className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={onFollowingClick}
              >
                <div className="text-[24px] font-bold text-white">{stats.following || 0}</div>
                <div className="text-[14px] text-zinc-400">Подписок</div>
              </div>

              <div 
                className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={onWatchingClick}
              >
                <div className="text-[24px] font-bold text-white">{stats.watching || 0}</div>
                <div className="text-[14px] text-zinc-400">Смотрю</div>
              </div>

              <div 
                className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={onWatchedClick}
              >
                <div className="text-[24px] font-bold text-white">{stats.watched || 0}</div>
                <div className="text-[14px] text-zinc-400">Просмотрено</div>
              </div>

              <div 
                className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={onPlannedClick}
              >
                <div className="text-[24px] font-bold text-white">{stats.plan || 0}</div>
                <div className="text-[14px] text-zinc-400">В планах</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}