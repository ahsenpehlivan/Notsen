import type { ActivityLog, Board, BoardLabel, Column, Task } from '@/types/board';

export const PASTEL_COLORS = [
  '#FCA5A5', '#FCD34D', '#86EFAC', '#93C5FD', '#C4B5FD', '#F9A8D4',
];

const generateId = () => Math.random().toString(36).substring(2, 9);

export function parseLabels(labels: unknown): BoardLabel[] {
  if (!labels || !Array.isArray(labels) || labels.length === 0) {
    return [
      { id: generateId(), name: 'Bug', color: '#FCA5A5' },
      { id: generateId(), name: 'Feature', color: '#93C5FD' },
      { id: generateId(), name: 'Tasarım', color: '#C4B5FD' },
      { id: generateId(), name: 'Acil', color: '#FCD34D' },
      { id: generateId(), name: 'Ar-Ge', color: '#86EFAC' },
    ];
  }

  return labels.map((l: unknown, i: number) => {
    if (typeof l === 'string') {
      return { id: generateId(), name: l, color: PASTEL_COLORS[i % PASTEL_COLORS.length] };
    }
    return l as BoardLabel;
  });
}

export function mapBoard(row: Record<string, unknown>): Board {
  return {
    id: row.id as string,
    title: row.title as string,
    user_id: row.user_id as string | undefined,
    labels: parseLabels(row.labels),
    position: (row.position as number) || 0,
  };
}

export function mapColumn(row: Record<string, unknown>): Column {
  return {
    id: row.id as string,
    boardId: row.board_id as string,
    title: row.title as string,
    position: row.position as number,
  };
}

export function mapTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    boardId: row.board_id as string,
    columnId: row.column_id as string,
    title: row.title as string,
    description: (row.description as string) || '',
    dueDate: (row.due_date as string) || '',
    tags: (row.tags as string[]) || [],
    assignee: (row.assignee as string) || '',
    checklist: (row.checklist as Task['checklist']) || [],
    comments: (row.comments as Task['comments']) || [],
    position: row.position as number,
    _dbColumnId: row.column_id as string,
    _dbPosition: row.position as number,
  };
}

export function mapActivityLog(row: Record<string, unknown>): ActivityLog {
  return {
    id: row.id as string,
    boardId: row.board_id as string,
    userEmail: row.user_email as string,
    action: row.action as string,
    entityType: row.entity_type as ActivityLog['entityType'],
    entityId: (row.entity_id as string) || undefined,
    entityTitle: (row.entity_title as string) || undefined,
    metadata: (row.metadata as Record<string, string>) || undefined,
    createdAt: row.created_at as string,
  };
}
