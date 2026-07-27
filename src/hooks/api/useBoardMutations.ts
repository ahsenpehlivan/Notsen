import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/board-api';
import { mapBoard, mapColumn, mapTask } from '@/lib/board-mappers';
import { queryKeys } from '@/lib/query-keys';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/store/useAuthStore';
import { getTemplate } from '@/lib/board-templates';
import type { Board, BoardLabel, Column, Task, WorkspaceData } from '@/types/board';

function getWorkspace(queryClient: ReturnType<typeof useQueryClient>, userId: string | null) {
  return queryClient.getQueryData<WorkspaceData>(queryKeys.workspace(userId));
}

function setWorkspace(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | null,
  updater: (prev: WorkspaceData) => WorkspaceData
) {
  queryClient.setQueryData<WorkspaceData>(queryKeys.workspace(userId), (prev) => {
    if (!prev) return prev;
    return updater(prev);
  });
}

function invalidateWorkspace(queryClient: ReturnType<typeof useQueryClient>, userId: string | null) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.workspace(userId) });
}

export function useBoardMutations() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? null;
  const userEmail = user?.email ?? 'Bilinmeyen';

  const addBoard = useMutation({
    mutationFn: async ({ title, templateId }: { title: string; templateId?: string }) => {
      const workspace = getWorkspace(queryClient, userId);
      const position = workspace?.boards.length ?? 0;
      const template = getTemplate(templateId || 'blank');

      const { data, error } = await supabase
        .from('boards')
        .insert({ user_id: userId!, title, position, labels: template.labels })
        .select()
        .single();

      if (error || !data) throw new Error(error?.message || 'Pano oluşturulamadı');

      const colsToInsert = template.columns.map((col, i) => ({
        board_id: data.id,
        title: col.title,
        position: i,
      }));
      const { data: insertedCols, error: colError } = await supabase.from('columns').insert(colsToInsert).select();
      if (colError) throw colError;

      const mappedCols = (insertedCols || []).map(mapColumn);
      let mappedTasks: Task[] = [];

      const tasksToInsert: Record<string, unknown>[] = [];
      template.columns.forEach((col, colIndex) => {
        const columnId = insertedCols?.[colIndex]?.id;
        if (!columnId) return;
        (col.tasks || []).forEach((t, taskIndex) => {
          tasksToInsert.push({
            board_id: data.id,
            column_id: columnId,
            title: t.title,
            description: t.description || '',
            tags: t.tags || [],
            position: taskIndex,
          });
        });
      });

      if (tasksToInsert.length > 0) {
        const { data: insertedTasks, error: taskError } = await supabase.from('tasks').insert(tasksToInsert).select();
        if (taskError) throw taskError;
        mappedTasks = (insertedTasks || []).map(mapTask);
      }

      return {
        board: mapBoard({ ...data, labels: template.labels }),
        columns: mappedCols,
        tasks: mappedTasks,
      };
    },
    onSuccess: ({ board, columns, tasks }) => {
      setWorkspace(queryClient, userId, (prev) => ({
        ...prev,
        boards: [...prev.boards, board],
        columns: [...prev.columns, ...columns],
        tasks: [...prev.tasks, ...tasks],
      }));
      toast.success('Pano oluşturuldu.');
    },
    onError: (err: Error) => toast.error('Pano oluşturulamadı: ' + err.message),
  });

  const deleteBoard = useMutation({
    mutationFn: async (id: string) => {
      const workspace = getWorkspace(queryClient, userId);
      const board = workspace?.boards.find((b) => b.id === id);
      const { error } = await supabase.from('boards').delete().eq('id', id);
      if (error) throw error;
      return board;
    },
    onSuccess: (board, id) => {
      setWorkspace(queryClient, userId, (prev) => ({
        boards: prev.boards.filter((b) => b.id !== id),
        columns: prev.columns.filter((c) => c.boardId !== id),
        tasks: prev.tasks.filter((t) => t.boardId !== id),
      }));
      toast.success(`"${board?.title ?? 'Pano'}" silindi.`);
    },
    onError: (err: Error) => toast.error('Pano silinemedi: ' + err.message),
  });

  const updateBoardTitle = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const workspace = getWorkspace(queryClient, userId);
      const oldBoard = workspace?.boards.find((b) => b.id === id);
      const trimmed = title.trim();
      const { error } = await supabase.from('boards').update({ title: trimmed }).eq('id', id);
      if (error) throw error;
      if (oldBoard) {
        await logActivity(id, userEmail, 'board_renamed', 'board', id, trimmed, {
          old_title: oldBoard.title,
          new_title: trimmed,
        });
      }
      return { id, title: trimmed };
    },
    onSuccess: ({ id, title }) => {
      setWorkspace(queryClient, userId, (prev) => ({
        ...prev,
        boards: prev.boards.map((b) => (b.id === id ? { ...b, title } : b)),
      }));
      queryClient.invalidateQueries({ queryKey: queryKeys.activityLogs(id) });
    },
  });

  const reorderBoards = useMutation({
    mutationFn: async (newOrder: Board[]) => {
      await Promise.all(
        newOrder.map((board, index) =>
          supabase.from('boards').update({ position: index }).eq('id', board.id)
        )
      );
      return newOrder;
    },
    onMutate: async (newOrder) => {
      setWorkspace(queryClient, userId, (prev) => ({ ...prev, boards: newOrder }));
    },
  });

  const updateBoardLabels = useMutation({
    mutationFn: async ({
      boardId,
      newLabels,
      oldLabelName,
      newLabelName,
    }: {
      boardId: string;
      newLabels: BoardLabel[];
      oldLabelName?: string;
      newLabelName?: string;
    }) => {
      const workspace = getWorkspace(queryClient, userId);
      const { error } = await supabase.from('boards').update({ labels: newLabels }).eq('id', boardId);
      if (error) throw error;

      if (oldLabelName && workspace) {
        const boardTasksToUpdate = workspace.tasks.filter(
          (t) => t.boardId === boardId && (t.tags || []).includes(oldLabelName)
        );
        await Promise.all(
          boardTasksToUpdate.map((t) => {
            let updatedTags = [...(t.tags || [])];
            if (newLabelName) {
              updatedTags = updatedTags.map((tag) => (tag === oldLabelName ? newLabelName : tag));
            } else {
              updatedTags = updatedTags.filter((tag) => tag !== oldLabelName);
            }
            return supabase.from('tasks').update({ tags: updatedTags }).eq('id', t.id);
          })
        );
      }
      return { boardId, newLabels, oldLabelName, newLabelName };
    },
    onSuccess: ({ boardId, newLabels, oldLabelName, newLabelName }) => {
      setWorkspace(queryClient, userId, (prev) => ({
        ...prev,
        boards: prev.boards.map((b) => (b.id === boardId ? { ...b, labels: newLabels } : b)),
        tasks: oldLabelName
          ? prev.tasks.map((t) => {
              if (t.boardId !== boardId || !(t.tags || []).includes(oldLabelName)) return t;
              let newTags = [...(t.tags || [])];
              if (newLabelName) {
                newTags = newTags.map((tag) => (tag === oldLabelName ? newLabelName : tag));
              } else {
                newTags = newTags.filter((tag) => tag !== oldLabelName);
              }
              return { ...t, tags: newTags };
            })
          : prev.tasks,
      }));
    },
  });

  return { addBoard, deleteBoard, updateBoardTitle, reorderBoards, updateBoardLabels };
}

export function useColumnMutations() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? null;
  const userEmail = user?.email ?? 'Bilinmeyen';

  const addColumn = useMutation({
    mutationFn: async ({ boardId, title }: { boardId: string; title: string }) => {
      const workspace = getWorkspace(queryClient, userId);
      const position = workspace?.columns.filter((c) => c.boardId === boardId).length ?? 0;
      const { data, error } = await supabase
        .from('columns')
        .insert({ board_id: boardId, title, position })
        .select()
        .single();
      if (error || !data) throw new Error(error?.message || 'Sütun eklenemedi');
      await logActivity(boardId, userEmail, 'column_created', 'column', data.id, title);
      return mapColumn(data);
    },
    onSuccess: (col) => {
      setWorkspace(queryClient, userId, (prev) => ({ ...prev, columns: [...prev.columns, col] }));
      queryClient.invalidateQueries({ queryKey: queryKeys.activityLogs(col.boardId) });
    },
    onError: (err: Error) => toast.error('Sütun eklenemedi: ' + err.message),
  });

  const deleteColumn = useMutation({
    mutationFn: async ({ id, boardId }: { id: string; boardId: string }) => {
      const workspace = getWorkspace(queryClient, userId);
      const col = workspace?.columns.find((c) => c.id === id);
      const { error } = await supabase.from('columns').delete().eq('id', id);
      if (error) throw error;
      if (col) await logActivity(boardId, userEmail, 'column_deleted', 'column', id, col.title);
      return id;
    },
    onSuccess: (id) => {
      setWorkspace(queryClient, userId, (prev) => ({
        ...prev,
        columns: prev.columns.filter((c) => c.id !== id),
        tasks: prev.tasks.filter((t) => t.columnId !== id),
      }));
    },
  });

  const updateColumn = useMutation({
    mutationFn: async ({ id, boardId, title }: { id: string; boardId: string; title: string }) => {
      const workspace = getWorkspace(queryClient, userId);
      const oldCol = workspace?.columns.find((c) => c.id === id);
      const { error } = await supabase.from('columns').update({ title }).eq('id', id);
      if (error) throw error;
      if (oldCol && oldCol.title !== title) {
        await logActivity(boardId, userEmail, 'column_renamed', 'column', id, title, {
          old_title: oldCol.title,
          new_title: title,
        });
      }
      return { id, title };
    },
    onSuccess: ({ id, title }, { boardId }) => {
      setWorkspace(queryClient, userId, (prev) => ({
        ...prev,
        columns: prev.columns.map((c) => (c.id === id ? { ...c, title } : c)),
      }));
      queryClient.invalidateQueries({ queryKey: queryKeys.activityLogs(boardId) });
    },
  });

  const reorderColumns = useMutation({
    mutationFn: async ({ boardId, newOrder }: { boardId: string; newOrder: Column[] }) => {
      await Promise.all(
        newOrder.map((col, index) =>
          supabase.from('columns').update({ position: index }).eq('id', col.id)
        )
      );
      return { boardId, newOrder };
    },
    onMutate: ({ boardId, newOrder }) => {
      setWorkspace(queryClient, userId, (prev) => ({
        ...prev,
        columns: [
          ...prev.columns.filter((c) => c.boardId !== boardId),
          ...newOrder.map((c, i) => ({ ...c, position: i })),
        ],
      }));
    },
  });

  return { addColumn, deleteColumn, updateColumn, reorderColumns };
}

export function useTaskMutations() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? null;
  const userEmail = user?.email ?? 'Bilinmeyen';

  const addTask = useMutation({
    mutationFn: async (input: {
      boardId: string;
      columnId: string;
      title: string;
      description?: string;
      dueDate?: string;
      tags?: string[];
      assignee?: string;
    }) => {
      const workspace = getWorkspace(queryClient, userId);
      const position = workspace?.tasks.filter((t) => t.columnId === input.columnId).length ?? 0;
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          board_id: input.boardId,
          column_id: input.columnId,
          title: input.title,
          description: input.description || '',
          due_date: input.dueDate || null,
          tags: input.tags || [],
          assignee: input.assignee || '',
          position,
        })
        .select()
        .single();
      if (error || !data) throw new Error(error?.message || 'Görev eklenemedi');
      await logActivity(input.boardId, userEmail, 'task_created', 'task', data.id, input.title);
      return mapTask(data);
    },
    onSuccess: (task) => {
      setWorkspace(queryClient, userId, (prev) => ({ ...prev, tasks: [...prev.tasks, task] }));
      queryClient.invalidateQueries({ queryKey: queryKeys.activityLogs(task.boardId) });
    },
    onError: (err: Error) => toast.error('Görev eklenemedi: ' + err.message),
  });

  const deleteTask = useMutation({
    mutationFn: async ({ id, boardId }: { id: string; boardId: string }) => {
      const workspace = getWorkspace(queryClient, userId);
      const task = workspace?.tasks.find((t) => t.id === id);
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      if (task) await logActivity(boardId, userEmail, 'task_deleted', 'task', id, task.title);
      return id;
    },
    onSuccess: (id) => {
      setWorkspace(queryClient, userId, (prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== id),
      }));
    },
  });

  const updateTask = useMutation({
    mutationFn: async (input: {
      id: string;
      boardId: string;
      title: string;
      description: string;
      dueDate?: string;
      tags?: string[];
      assignee?: string;
      checklist?: Task['checklist'];
    }) => {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: input.title,
          description: input.description,
          due_date: input.dueDate || null,
          tags: input.tags,
          assignee: input.assignee,
          checklist: input.checklist,
        })
        .eq('id', input.id);
      if (error) throw error;
      await logActivity(input.boardId, userEmail, 'task_updated', 'task', input.id, input.title);
      return input;
    },
    onSuccess: (input) => {
      setWorkspace(queryClient, userId, (prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === input.id
            ? {
                ...t,
                title: input.title,
                description: input.description,
                dueDate: input.dueDate,
                tags: input.tags,
                assignee: input.assignee,
                checklist: input.checklist,
              }
            : t
        ),
      }));
      queryClient.invalidateQueries({ queryKey: queryKeys.activityLogs(input.boardId) });
    },
  });

  const syncTaskOrder = useMutation({
    mutationFn: async ({ boardId, tasks, columns }: { boardId: string; tasks: Task[]; columns: Column[] }) => {
      const boardTasks = tasks.filter((t) => t.boardId === boardId);
      const columnGroups: Record<string, Task[]> = {};
      boardTasks.forEach((t) => {
        if (!columnGroups[t.columnId]) columnGroups[t.columnId] = [];
        columnGroups[t.columnId].push(t);
      });

      const updates: { taskId: string; colId: string; index: number }[] = [];
      const moveLogItems: { taskTitle: string; fromCol: string; toCol: string }[] = [];
      const updatedTasks = [...tasks];

      Object.entries(columnGroups).forEach(([colId, colTasks]) => {
        colTasks.forEach((task, index) => {
          if (task._dbColumnId !== colId || task._dbPosition !== index) {
            const taskIdx = updatedTasks.findIndex((t) => t.id === task.id);
            if (taskIdx !== -1) {
              updatedTasks[taskIdx] = {
                ...updatedTasks[taskIdx],
                position: index,
                columnId: colId,
                _dbColumnId: colId,
                _dbPosition: index,
              };
            }
            if (task._dbColumnId && task._dbColumnId !== colId) {
              const fromColTitle = columns.find((c) => c.id === task._dbColumnId)?.title || '?';
              const toColTitle = columns.find((c) => c.id === colId)?.title || '?';
              moveLogItems.push({ taskTitle: task.title, fromCol: fromColTitle, toCol: toColTitle });
            }
            updates.push({ taskId: task.id, colId, index });
          }
        });
      });

      if (updates.length > 0) {
        await Promise.all(
          updates.map(({ taskId, colId, index }) =>
            supabase.from('tasks').update({ column_id: colId, position: index }).eq('id', taskId)
          )
        );
        for (const item of moveLogItems) {
          await logActivity(boardId, userEmail, 'task_moved', 'task', undefined, item.taskTitle, {
            from_column: item.fromCol,
            to_column: item.toCol,
          });
        }
      }

      return { boardId, updatedTasks, changed: updates.length > 0 };
    },
    onSuccess: ({ boardId, updatedTasks, changed }) => {
      if (changed) {
        setWorkspace(queryClient, userId, (prev) => ({ ...prev, tasks: updatedTasks }));
        queryClient.invalidateQueries({ queryKey: queryKeys.activityLogs(boardId) });
      }
    },
  });

  return { addTask, deleteTask, updateTask, syncTaskOrder };
}

export function useMemberMutations() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const userEmail = user?.email ?? 'Bilinmeyen';

  const inviteToBoard = useMutation({
    mutationFn: async ({
      boardId,
      email,
      role,
    }: {
      boardId: string;
      email: string;
      role: 'viewer' | 'editor';
    }) => {
      const { error } = await supabase
        .from('board_members')
        .insert({ board_id: boardId, user_email: email, role });
      if (error) {
        if (error.code === '23505') throw new Error('Kullanıcı zaten bu panoda.');
        throw error;
      }
      await logActivity(boardId, userEmail, 'member_invited', 'member', undefined, email, { role });
      return boardId;
    },
    onSuccess: (boardId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members(boardId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activityLogs(boardId) });
    },
  });

  const updateMemberRole = useMutation({
    mutationFn: async ({ memberId, boardId, role }: { memberId: string; boardId: string; role: 'viewer' | 'editor' }) => {
      const { error } = await supabase.from('board_members').update({ role }).eq('id', memberId);
      if (error) throw error;
      return boardId;
    },
    onSuccess: (boardId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members(boardId) });
    },
  });

  const removeMember = useMutation({
    mutationFn: async ({ memberId, boardId }: { memberId: string; boardId: string }) => {
      const { error } = await supabase.from('board_members').delete().eq('id', memberId);
      if (error) throw error;
      return boardId;
    },
    onSuccess: (boardId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members(boardId) });
    },
  });

  return { inviteToBoard, updateMemberRole, removeMember };
}

export { invalidateWorkspace, setWorkspace, getWorkspace };
