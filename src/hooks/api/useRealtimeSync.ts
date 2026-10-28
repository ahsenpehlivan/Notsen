'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-keys';
import { useBoardStore } from '@/store/useBoardStore';
import { useAuthStore } from '@/store/useAuthStore';

export function useRealtimeSync(boardIds: string[]) {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const boardIdsKey = boardIds.join(',');
  const boardIdsSetRef = useRef<Set<string>>(new Set(boardIds));

  useEffect(() => {
    boardIdsSetRef.current = new Set(boardIds);
  }, [boardIdsKey]);

  useEffect(() => {
    if (!boardIdsKey || !userId) return;

    let workspaceTimer: ReturnType<typeof setTimeout> | null = null;
    const activityTimers = new Map<string, ReturnType<typeof setTimeout>>();

    const invalidateWorkspace = () => {
      if (useBoardStore.getState().isDragging) return;
      if (workspaceTimer) clearTimeout(workspaceTimer);
      workspaceTimer = setTimeout(() => {
        if (!useBoardStore.getState().isDragging) {
          queryClient.invalidateQueries({ queryKey: queryKeys.workspace(userId) });
        }
      }, 300);
    };

    const invalidateMembers = (boardId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members(boardId) });
    };

    const invalidateActivity = (boardId: string) => {
      const prev = activityTimers.get(boardId);
      if (prev) clearTimeout(prev);
      activityTimers.set(
        boardId,
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.activityLogs(boardId) });
          activityTimers.delete(boardId);
        }, 300)
      );
    };

    const channel = supabase
      .channel('notsen-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        const row = (payload.new || payload.old) as { board_id?: string };
        if (row.board_id && boardIdsSetRef.current.has(row.board_id)) {
          invalidateWorkspace();
          invalidateActivity(row.board_id);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'columns' }, (payload) => {
        const row = (payload.new || payload.old) as { board_id?: string };
        if (row.board_id && boardIdsSetRef.current.has(row.board_id)) {
          invalidateWorkspace();
          invalidateActivity(row.board_id);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'boards' }, (payload) => {
        const row = payload.new as { id?: string };
        if (row.id && boardIdsSetRef.current.has(row.id)) {
          invalidateWorkspace();
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'board_members' }, (payload) => {
        const row = (payload.new || payload.old) as { board_id?: string };
        if (row.board_id && boardIdsSetRef.current.has(row.board_id)) {
          invalidateMembers(row.board_id);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, (payload) => {
        const row = payload.new as { board_id?: string };
        if (row.board_id && boardIdsSetRef.current.has(row.board_id)) {
          invalidateActivity(row.board_id);
        }
      })
      .subscribe();

    return () => {
      if (workspaceTimer) clearTimeout(workspaceTimer);
      activityTimers.forEach((t) => clearTimeout(t));
      supabase.removeChannel(channel);
    };
  }, [boardIdsKey, userId, queryClient]);
}
