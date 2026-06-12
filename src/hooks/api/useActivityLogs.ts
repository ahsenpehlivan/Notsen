import { useQuery } from '@tanstack/react-query';
import { fetchActivityLogs } from '@/lib/board-api';
import { queryKeys } from '@/lib/query-keys';

export function useActivityLogs(boardId: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.activityLogs(boardId),
    queryFn: () => fetchActivityLogs(boardId!),
    enabled: !!boardId && enabled,
  });
}
