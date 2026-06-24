import { createClient } from '@/lib/supabase/server';
import { ThreadClient } from '@/components/thread/ThreadClient';
import { notFound } from 'next/navigation';

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const threadId = parseInt(id, 10);

  if (isNaN(threadId)) notFound();

  const supabase = await createClient();

  const { data: thread, error } = await supabase
    .from('threads')
    .select(`
      *,
      author:profiles!threads_user_id_fkey (id, username, avatar_url),
      content_info:content (id, title, type, poster_url),
      episodes (
        id, 
        episode_number, 
        title,
        season:seasons (season_number)
      )
    `)
    .eq('id', threadId)
    .single();

  if (error || !thread) {
    console.error('Thread error:', error);
    notFound();
  }

  const { data: comments } = await supabase
    .from('comments')
    .select(`
      *,
      profiles!comments_user_id_fkey (username, avatar_url),
      votes (value)
    `)
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });

  return <ThreadClient thread={thread} initialComments={comments || []} />;
}