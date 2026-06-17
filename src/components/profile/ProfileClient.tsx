'use client'

import { useState, useCallback } from 'react';
import { ProfileHeader } from './ProfileHeader';
import { ProfileTabs } from './ProfileTabs';
import { PostsTab } from './tabs/PostsTab';
import { ReviewsTab } from './tabs/ReviewsTab';
import { RatingsTab } from './tabs/RatingsTab';
import { ThreadsTab } from './tabs/ThreadsTab';
import FollowersModal from './FollowersModal';
import FollowingModal from './FollowingModal';

type Tab = 'posts' | 'reviews' | 'ratings' | 'threads';

interface ProfileClientProps {
  profile: any;
  data: any;
  currentUser: any;
}

export function ProfileClient({ profile, data, currentUser }: ProfileClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('posts');
  const [posts, setPosts] = useState(data.posts || []);
  const [isFollowersOpen, setIsFollowersOpen] = useState(false);
  const [isFollowingOpen, setIsFollowingOpen] = useState(false);

  const refreshPosts = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <div className="container mx-auto px-4 max-w-[1440px]">
      <ProfileHeader 
        profile={profile} 
        stats={data.stats} 
        currentUser={currentUser}
        onFollowersClick={() => setIsFollowersOpen(true)}
        onFollowingClick={() => setIsFollowingOpen(true)}
      />

      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="mt-6">
        {activeTab === 'posts' && <PostsTab userId={profile.id} posts={posts} onPostCreated={refreshPosts} currentUser={currentUser} />}
        {activeTab === 'reviews' && <ReviewsTab reviews={data.reviews} currentUser={currentUser} />}
        {activeTab === 'ratings' && <RatingsTab ratings={data.ratings} currentUser={currentUser} />}
        {activeTab === 'threads' && <ThreadsTab threads={data.threads} currentUser={currentUser} />}
      </div>

      <FollowersModal
        isOpen={isFollowersOpen}
        onClose={() => setIsFollowersOpen(false)}
        userId={profile.id}
        username={profile.username}
      />

      <FollowingModal
        isOpen={isFollowingOpen}
        onClose={() => setIsFollowingOpen(false)}
        userId={profile.id}
        username={profile.username}
      />
    </div>
  );
}