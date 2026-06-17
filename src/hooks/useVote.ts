'use client';

import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import { useState } from 'react';

type EntityType = 'post' | 'thread' | 'review' | 'comment';

export const useVote = () => {
  const supabase = createClient();
  const { user } = useAuthStore();
  const [loadingIds, setLoadingIds] = useState<string[]>([]);

  const toggleVote = async (type: EntityType, id: number, currentValue: 1 | -1 | null) => {
    if (!user) return;

    const loadingKey = `${type}-${id}`;
    setLoadingIds(prev => [...prev, loadingKey]);

    const columnName = `${type}_id`;

    try {
      if (currentValue !== null) {
        await supabase
          .from('votes')
          .delete()
          .eq('user_id', user.id)
          .eq(columnName, id);
      } else {
        await supabase
          .from('votes')
          .insert({
            user_id: user.id,
            [columnName]: id,
            value: 1
          });
      }
    } catch (error: any) {
      console.error(`Vote error (${type}):`, error.message || error);
    } finally {
      setLoadingIds(prev => prev.filter(k => k !== loadingKey));
    }
  };

  return { toggleVote, loadingIds };
};