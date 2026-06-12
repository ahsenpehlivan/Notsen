import { supabase } from '@/lib/supabase';
import { mapActivityLog, mapBoard, mapColumn, mapTask } from '@/lib/board-mappers';
import type { ActivityLog, Board, BoardMember, Column, Task, WorkspaceData } from '@/types/board';

export async function fetchWorkspace(userId: string, email: string): Promise<WorkspaceData> {
  const { data: ownedBoards, error: ownedError } = await supabase
    .from('boards')
    .select('*')
    .eq('user_id', userId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (ownedError) throw ownedError;

  let allBoards = [...(ownedBoards || [])];

  try {
    const { data: memberRecords } = await supabase
      .from('board_members')
      .select('board_id')
      .eq('user_email', email);

    if (memberRecords && memberRecords.length > 0) {
      const memberBoardIds = memberRecords.map((r) => r.board_id);
      const { data: sharedBoards } = await supabase
        .from('boards')
        .select('*')
        .in('id', memberBoardIds);

      if (sharedBoards) {
        const ownedIds = new Set(allBoards.map((b) => b.id));
        sharedBoards.forEach((sb) => {
          if (!ownedIds.has(sb.id)) allBoards.push(sb);
        });
      }
    }
  } catch {
    // board_members table may not exist yet
  }

  const mappedBoards: Board[] = allBoards.map(mapBoard);
  mappedBoards.sort((a, b) => (a.position || 0) - (b.position || 0));

  if (mappedBoards.length === 0) {
    return { boards: [], columns: [], tasks: [] };
  }

  const boardIds = mappedBoards.map((b) => b.id);

  const [colsRes, tasksRes] = await Promise.all([
    supabase.from('columns').select('*').in('board_id', boardIds).order('position', { ascending: true }),
    supabase.from('tasks').select('*').in('board_id', boardIds).order('position', { ascending: true }),
  ]);

  if (colsRes.error) throw colsRes.error;
  if (tasksRes.error) throw tasksRes.error;

  return {
    boards: mappedBoards,
    columns: (colsRes.data || []).map(mapColumn),
    tasks: (tasksRes.data || []).map(mapTask),
  };
}

export async function fetchMembers(boardId: string): Promise<BoardMember[]> {
  const { data, error } = await supabase.from('board_members').select('*').eq('board_id', boardId);
  if (error) throw error;
  return data || [];
}

export async function fetchActivityLogs(boardId: string): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('board_id', boardId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data || []).map(mapActivityLog);
}

export async function logActivity(
  boardId: string,
  userEmail: string,
  action: string,
  entityType: ActivityLog['entityType'],
  entityId?: string,
  entityTitle?: string,
  metadata?: Record<string, string>
) {
  await supabase.from('activity_logs').insert({
    board_id: boardId,
    user_email: userEmail,
    action,
    entity_type: entityType,
    entity_id: entityId || null,
    entity_title: entityTitle || null,
    metadata: metadata || {},
  });
}

export function resolveUserRole(
  board: Board | undefined,
  members: BoardMember[],
  userId?: string,
  userEmail?: string
): 'viewer' | 'editor' | 'owner' {
  if (board?.user_id === userId) return 'owner';
  const myMember = members.find((m) => m.user_email === userEmail);
  if (myMember) return myMember.role as 'viewer' | 'editor';
  return 'viewer';
}

export type { Task, Column, Board };
