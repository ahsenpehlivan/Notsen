import { useQuery } from '@tanstack/react-query';
import { fetchMembers, resolveUserRole } from '@/lib/board-api';
import { queryKeys } from '@/lib/query-keys';
import type { Board } from '@/types/board';
import { useAuthStore } from '@/store/useAuthStore';

export function useMembers(boardId: string | null, board?: Board) {
  const user = useAuthStore((s) => s.user);

  const query = useQuery({
    queryKey: queryKeys.members(boardId),
    queryFn: () => fetchMembers(boardId!),
    enabled: !!boardId,
  });

  const currentUserRole = board
    ? resolveUserRole(board, query.data || [], user?.id, user?.email)
    : null;

  return { ...query, members: query.data || [], currentUserRole };
}
