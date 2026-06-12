import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/store/useAuthStore';
import type { Task, WorkspaceData } from '@/types/board';

export function useWorkspaceUpdater() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  const updateTasks = useCallback(
    (updater: (tasks: Task[]) => Task[]) => {
      queryClient.setQueryData<WorkspaceData>(queryKeys.workspace(userId), (prev) => {
        if (!prev) return prev;
        return { ...prev, tasks: updater(prev.tasks) };
      });
    },
    [queryClient, userId]
  );

  const getTasks = useCallback((): Task[] => {
    const workspace = queryClient.getQueryData<WorkspaceData>(queryKeys.workspace(userId));
    return workspace?.tasks ?? [];
  }, [queryClient, userId]);

  const getColumns = useCallback(() => {
    const workspace = queryClient.getQueryData<WorkspaceData>(queryKeys.workspace(userId));
    return workspace?.columns ?? [];
  }, [queryClient, userId]);

  return { updateTasks, getTasks, getColumns };
}
