import { createClient } from '@/lib/supabase/server';
import { ThreadClient } from '@/components/thread/ThreadClient';
import type { Database } from '@/types/database.types';

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const threadId = parseInt(id);

  const supabase = await createClient();   // ← await здесь обязателен!

  const { data: thread } = await supabase
    .from('threads')
    .select(`
      *,
      author:profiles (id, username, avatar_url, banner_url)
    `)
    .eq('id', threadId)
    .maybeSingle();

  if (!thread) {
    return <div className="text-center py-20">Тред не найден</div>;
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