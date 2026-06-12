const lastBoardKey = (userId: string) => `notsen-last-board-${userId}`;

export function getLastBoardId(userId: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(lastBoardKey(userId));
}

export function setLastBoardId(userId: string, boardId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(lastBoardKey(userId), boardId);
}

export function clearLastBoardId(userId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(lastBoardKey(userId));
}
