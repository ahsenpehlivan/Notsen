import { useCallback } from 'react';
import { useBoardStore } from '@/store/useBoardStore';
import { useAuthStore } from '@/store/useAuthStore';
import { setLastBoardId } from '@/lib/preferences';

export function useActiveBoard() {
  const activeBoardId = useBoardStore((s) => s.activeBoardId);
  const setActiveBoardStore = useBoardStore((s) => s.setActiveBoard);
  const userId = useAuthStore((s) => s.user?.id);

  const setActiveBoard = useCallback(
    (boardId: string) => {
      setActiveBoardStore(boardId);
      if (userId) setLastBoardId(userId, boardId);
    },
    [setActiveBoardStore, userId]
  );

  return { activeBoardId, setActiveBoard };
}
