'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleFollow(followingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Необходимо авторизоваться');
  }

  const followerId = user.id;

  if (followerId === followingId) {
    throw new Error('Нельзя подписаться на себя');
  }

  // Проверяем текущий статус подписки
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();

  if (existing) {
    // Отписка
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) throw error;
    revalidatePath(`/profile/${followingId}`);
    return { success: true, isFollowing: false };
  } else {
    // Подписка
    const { error } = await supabase
      .from('subscriptions')
      .insert({ follower_id: followerId, following_id: followingId });

    if (error) throw error;
    revalidatePath(`/profile/${followingId}`);
    return { success: true, isFollowing: true };
  }
}