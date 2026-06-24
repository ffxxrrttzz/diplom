'use client';

import { User, Edit, Calendar, Users } from 'lucide-react';
import ClientOnly from '@/components/ui/ClientOnly';

interface ProfileHeaderProps {
  profile: any;
  stats?: any;
  currentUser: any;
  onEditClick?: () => void;
  
  // Добавляем все обработчики, которые передаются из ProfileClient
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
  onWatchingClick?: () => void;
  onWatchedClick?: () => void;
  onPlannedClick?: () => void;
}

export default function ProfileHeader({ 
  profile, 
  stats, 
  currentUser, 
  onEditClick,
  onFollowersClick,
  onFollowingClick,
  onWatchingClick,
  onWatchedClick,
  onPlannedClick 
}: ProfileHeaderProps) {

  const isOwner = currentUser?.id === profile.id;

  return (
    <div className="relative" suppressHydrationWarning>
      {/* Баннер */}
      <div 
        className="h-[333px] lg:h-[400px] rounded-[20px] overflow-hidden bg-zinc-800 relative"
        suppressHydrationWarning
      >
        <ClientOnly>
          {profile.banner_url ? (
            <img 
              src={profile.banner_url} 
              alt="Banner" 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-900/30 to-zinc-900" />
          )}
        </ClientOnly>
      </div>

      {/* Аватар + Инфо */}
      <div className="px-6 -mt-16 relative z-10 flex flex-col md:flex-row gap-6">
        <div className="w-[150px] h-[150px] rounded-full bg-zinc-700 overflow-hidden border-4 border-[#121216] flex-shrink-0" suppressHydrationWarning>
          <ClientOnly>
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.username} 
                className="w-full h-full object-cover"
                onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-400">
                <User className="w-16 h-16" />
              </div>
            )}
          </ClientOnly>
        </div>

        <div className="flex-1 pt-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold">{profile.username}</h1>
              <ClientOnly>
                <p className="text-zinc-400 mt-1">@{profile.username}</p>
              </ClientOnly>
            </div>

            {isOwner && (
              <button
                onClick={onEditClick}
                className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
              >
                <Edit className="w-5 h-5" />
                Редактировать
              </button>
            )}
          </div>

          {profile.bio && (
            <ClientOnly>
              <p className="mt-4 text-zinc-300 max-w-2xl">{profile.bio}</p>
            </ClientOnly>
          )}

          <div className="flex items-center gap-6 mt-6 text-sm text-zinc-400">
            <ClientOnly>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>На сайте с {new Date(profile.created_at).getFullYear()}</span>
              </div>
            </ClientOnly>
            
            {(stats || profile) && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{stats?.readers_count || profile.readers_count || 0} читателей</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}