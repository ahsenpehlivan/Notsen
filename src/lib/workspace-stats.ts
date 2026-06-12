import type { Board, Task, WorkspaceData } from '@/types/board';

export interface WorkspaceStats {
  totalBoards: number;
  ownedBoards: number;
  sharedBoards: number;
  totalColumns: number;
  totalTasks: number;
  assignedToMe: number;
  withDueDate: number;
  overdue: number;
  dueThisWeek: number;
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWorkspaceStats(
  workspace: WorkspaceData | undefined,
  userId?: string,
  userEmail?: string
): WorkspaceStats {
  const boards = workspace?.boards ?? [];
  const columns = workspace?.columns ?? [];
  const tasks = workspace?.tasks ?? [];

  const today = startOfDay(new Date());
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const ownedBoards = userId ? boards.filter((b) => b.user_id === userId).length : boards.length;
  const assignedToMe = userEmail
    ? tasks.filter((t) => t.assignee === userEmail).length
    : 0;

  const tasksWithDue = tasks.filter((t) => t.dueDate);
  const overdue = tasksWithDue.filter((t) => startOfDay(new Date(t.dueDate!)) < today).length;
  const dueThisWeek = tasksWithDue.filter((t) => {
    const due = startOfDay(new Date(t.dueDate!));
    return due >= today && due <= weekEnd;
  }).length;

  return {
    totalBoards: boards.length,
    ownedBoards,
    sharedBoards: boards.length - ownedBoards,
    totalColumns: columns.length,
    totalTasks: tasks.length,
    assignedToMe,
    withDueDate: tasksWithDue.length,
    overdue,
    dueThisWeek,
  };
}

export function getMyTasks(workspace: WorkspaceData | undefined, userEmail?: string): (Task & { board?: Board })[] {
  if (!workspace || !userEmail) return [];
  const boardMap = new Map(workspace.boards.map((b) => [b.id, b]));
  return workspace.tasks
    .filter((t) => t.assignee === userEmail)
    .map((t) => ({ ...t, board: boardMap.get(t.boardId) }))
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return a.title.localeCompare(b.title, 'tr');
    });
}

export function getTasksByDate(workspace: WorkspaceData | undefined): Map<string, (Task & { board?: Board })[]> {
  const map = new Map<string, (Task & { board?: Board })[]>();
  if (!workspace) return map;

  const boardMap = new Map(workspace.boards.map((b) => [b.id, b]));
  workspace.tasks
    .filter((t) => t.dueDate)
    .forEach((t) => {
      const key = t.dueDate!.split('T')[0];
      const entry = { ...t, board: boardMap.get(t.boardId) };
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entry);
    });

  return map;
}
