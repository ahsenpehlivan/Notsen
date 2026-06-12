export const queryKeys = {
  workspace: (userId?: string | null) => ['workspace', userId] as const,
  members: (boardId?: string | null) => ['members', boardId] as const,
  activityLogs: (boardId?: string | null) => ['activityLogs', boardId] as const,
  notes: (userId?: string | null) => ['notes', userId] as const,
};
