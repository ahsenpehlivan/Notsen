'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-keys';
import { useBoardStore } from '@/store/useBoardStore';
import { useAuthStore } from '@/store/useAuthStore';

export function useRealtimeSync(boardIds: string[]) {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  useEffect(() => {
    if (boardIds.length === 0 || !userId) return;

    const invalidateWorkspace = () => {
      if (!useBoardStore.getState().isDragging) {
        queryClient.invalidateQueries({ queryKey: queryKeys.workspace(userId) });
      }
    };

    const invalidateMembers = (boardId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members(boardId) });
    };

    const invalidateActivity = (boardId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activityLogs(boardId) });
    };

    const channel = supabase
      .channel('notsen-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        const row = (payload.new || payload.old) as { board_id?: string };
        if (row.board_id && boardIds.includes(row.board_id)) {
          invalidateWorkspace();
          invalidateActivity(row.board_id);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'columns' }, (payload) => {
        const row = (payload.new || payload.old) as { board_id?: string };
        if (row.board_id && boardIds.includes(row.board_id)) {
          invalidateWorkspace();
          invalidateActivity(row.board_id);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'boards' }, (payload) => {
        const row = payload.new as { id?: string };
        if (row.id && boardIds.includes(row.id)) {
          invalidateWorkspace();
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'board_members' }, (payload) => {
        const row = (payload.new || payload.old) as { board_id?: string };
        if (row.board_id && boardIds.includes(row.board_id)) {
          invalidateMembers(row.board_id);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, (payload) => {
        const row = payload.new as { board_id?: string };
        if (row.board_id && boardIds.includes(row.board_id)) {
          invalidateActivity(row.board_id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardIds, userId, queryClient]);
}
