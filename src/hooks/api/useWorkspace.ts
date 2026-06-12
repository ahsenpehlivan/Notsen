import { useQuery } from '@tanstack/react-query';
import { fetchWorkspace } from '@/lib/board-api';
import { queryKeys } from '@/lib/query-keys';

export function useWorkspace(userId: string | null, email: string | null) {
  return useQuery({
    queryKey: queryKeys.workspace(userId),
    queryFn: () => fetchWorkspace(userId!, email!),
    enabled: !!userId && !!email,
  });
}
