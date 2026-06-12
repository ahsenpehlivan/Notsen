export type Id = string;

export type ThemeName =
  | 'charcoal' | 'midnight' | 'cream-slate' | 'stone-indigo' | 'warm-linen'
  | 'cyberpunk' | 'nordic' | 'sakura' | 'hacker' | 'sunset'
  | 'deep-ocean' | 'high-contrast' | 'amber-wood';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface TaskComment {
  id: string;
  userEmail: string;
  text: string;
  createdAt: string;
}

export interface Note {
  id: string;
  user_id: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  boardId: Id;
  userEmail: string;
  action: string;
  entityType: 'task' | 'column' | 'board' | 'member' | 'label';
  entityId?: string;
  entityTitle?: string;
  metadata?: Record<string, string>;
  createdAt: string;
}

export interface BoardLabel {
  id: string;
  name: string;
  color: string;
}

export interface Board {
  id: Id;
  title: string;
  user_id?: string;
  labels?: BoardLabel[];
  position?: number;
}

export interface BoardMember {
  id: string;
  board_id: string;
  user_email: string;
  role: 'viewer' | 'editor' | 'owner';
}

export interface Column {
  id: Id;
  boardId: Id;
  title: string;
  position: number;
}

export interface Task {
  id: Id;
  boardId: Id;
  columnId: Id;
  title: string;
  description: string;
  dueDate?: string;
  tags?: string[];
  assignee?: string;
  checklist?: ChecklistItem[];
  comments?: TaskComment[];
  position: number;
  _dbColumnId?: Id;
  _dbPosition?: number;
}

export interface WorkspaceData {
  boards: Board[];
  columns: Column[];
  tasks: Task[];
}
