import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export type Id = string;
export type ThemeName = 'charcoal' | 'midnight' | 'cream-slate' | 'stone-indigo' | 'warm-linen' | 'cyberpunk' | 'nordic' | 'sakura' | 'hacker' | 'sunset' | 'deep-ocean' | 'high-contrast' | 'amber-wood';

const VALID_THEMES: ThemeName[] = ['charcoal', 'midnight', 'cream-slate', 'stone-indigo', 'warm-linen', 'cyberpunk', 'nordic', 'sakura', 'hacker', 'sunset', 'deep-ocean', 'high-contrast', 'amber-wood'];

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
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

export const PASTEL_COLORS = [
  '#FCA5A5', // Red
  '#FCD34D', // Yellow
  '#86EFAC', // Green
  '#93C5FD', // Blue
  '#C4B5FD', // Purple
  '#F9A8D4', // Pink
];

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
  position: number;
  _dbColumnId?: Id;
  _dbPosition?: number;
}

interface BoardState {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;

  isLoading: boolean;
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
  boards: Board[];
  activeBoardId: Id | null;
  columns: Column[];
  tasks: Task[];
  members: BoardMember[];
  currentUserRole: 'viewer' | 'editor' | 'owner' | null;

  loadUserData: (userId: string, email: string) => Promise<void>;

  addBoard: (userId: string, title: string) => Promise<void>;
  deleteBoard: (id: Id) => Promise<void>;
  updateBoardTitle: (id: Id, title: string) => Promise<void>;
  reorderBoards: (newOrder: Board[]) => Promise<void>;
  setActiveBoard: (id: Id) => void;
  inviteToBoard: (boardId: Id, email: string, role: 'viewer' | 'editor') => Promise<{ success: boolean; error?: string }>;
  fetchMembers: (boardId: Id) => Promise<void>;
  updateMemberRole: (memberId: string, role: 'viewer' | 'editor') => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;

  setColumns: (columns: Column[]) => void;
  setTasks: (tasks: Task[]) => void;
  addColumn: (boardId: Id, title: string) => Promise<void>;
  deleteColumn: (id: Id) => Promise<void>;
  updateColumn: (id: Id, title: string) => Promise<void>;
  reorderColumns: (boardId: Id, newOrder: Column[]) => Promise<void>;

  addTask: (boardId: Id, columnId: Id, title: string, description?: string, dueDate?: string, tags?: string[], assignee?: string) => Promise<void>;
  deleteTask: (id: Id) => Promise<void>;
  updateTask: (id: Id, title: string, description: string, dueDate?: string, tags?: string[], assignee?: string, checklist?: ChecklistItem[]) => Promise<void>;
  moveTask: (taskId: Id, toColumnId: Id) => Promise<void>;
  updateBoardLabels: (boardId: Id, newLabels: BoardLabel[], oldLabelName?: string, newLabelName?: string) => Promise<void>;
  syncTaskOrder: (boardId: Id) => Promise<void>;

  subscribeToRealtime: (boardIds: Id[]) => void;
  unsubscribeFromRealtime: () => void;

  activityLogs: ActivityLog[];
  fetchActivityLogs: (boardId: Id) => Promise<void>;
  _logActivity: (boardId: Id, action: string, entityType: ActivityLog['entityType'], entityId?: string, entityTitle?: string, metadata?: Record<string, string>) => Promise<void>;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const parseLabels = (labels: any): BoardLabel[] => {
  if (!labels || !Array.isArray(labels) || labels.length === 0) {
    return [
      { id: generateId(), name: 'Bug', color: '#FCA5A5' },
      { id: generateId(), name: 'Feature', color: '#93C5FD' },
      { id: generateId(), name: 'Tasarım', color: '#C4B5FD' },
      { id: generateId(), name: 'Acil', color: '#FCD34D' },
      { id: generateId(), name: 'Ar-Ge', color: '#86EFAC' },
    ];
  }
  
  return labels.map((l: any, i: number) => {
    if (typeof l === 'string') {
      return { id: generateId(), name: l, color: PASTEL_COLORS[i % PASTEL_COLORS.length] };
    }
    return l;
  });
};

const getSavedTheme = (): ThemeName => {
  if (typeof window === 'undefined') return 'charcoal';
  const saved = localStorage.getItem('taskflow-theme') as ThemeName;
  return VALID_THEMES.includes(saved) ? saved : 'charcoal';
};

export const useBoardStore = create<BoardState>((set, get) => ({
  theme: 'charcoal',
  setTheme: (theme) => {
    if (typeof window !== 'undefined') localStorage.setItem('taskflow-theme', theme);
    set({ theme });
  },

  isLoading: false,
  isDragging: false,
  setIsDragging: (v) => set({ isDragging: v }),
  boards: [],
  activeBoardId: null,
  columns: [],
  tasks: [],
  members: [],
  currentUserRole: null,
  activityLogs: [],

  _logActivity: async (boardId, action, entityType, entityId, entityTitle, metadata) => {
    const email = useAuthStore.getState().user?.email || 'Bilinmeyen';
    const { error } = await supabase.from('activity_logs').insert({
      board_id: boardId,
      user_email: email,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      entity_title: entityTitle || null,
      metadata: metadata || {},
    });
    if (error) return;
    // Panelin aciksa state'i anlik guncelle
    const newLog: ActivityLog = {
      id: generateId(),
      boardId,
      userEmail: email,
      action,
      entityType,
      entityId,
      entityTitle,
      metadata,
      createdAt: new Date().toISOString(),
    };
    set(state => ({ activityLogs: [newLog, ...state.activityLogs].slice(0, 100) }));
  },

  fetchActivityLogs: async (boardId) => {
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('board_id', boardId)
      .order('created_at', { ascending: false })
      .limit(100);
    const mapped: ActivityLog[] = (data || []).map(r => ({
      id: r.id,
      boardId: r.board_id,
      userEmail: r.user_email,
      action: r.action,
      entityType: r.entity_type,
      entityId: r.entity_id,
      entityTitle: r.entity_title,
      metadata: r.metadata,
      createdAt: r.created_at,
    }));
    set({ activityLogs: mapped });
  },

  loadUserData: async (userId: string, email: string) => {
    set({ isLoading: true });

    const savedTheme = getSavedTheme();
    set({ theme: savedTheme });

    // Sahip olunan panolar
    const { data: ownedBoards } = await supabase
      .from('boards')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    let allBoards = [...(ownedBoards || [])];

    // Paylaşılan panolar (Eğer SQL script çalıştırılmışsa)
    try {
      const { data: memberRecords } = await supabase
        .from('board_members')
        .select('board_id')
        .eq('user_email', email);

      if (memberRecords && memberRecords.length > 0) {
        const memberBoardIds = memberRecords.map(r => r.board_id);
        const { data: sharedBoards } = await supabase
          .from('boards')
          .select('*')
          .in('id', memberBoardIds);
          
        if (sharedBoards) {
          const ownedIds = new Set(allBoards.map(b => b.id));
          sharedBoards.forEach(sb => {
            if (!ownedIds.has(sb.id)) allBoards.push(sb);
          });
        }
      }
    } catch (err) {
      console.warn('Board sharing tables not found. Run the SQL setup script.');
    }

    const mappedBoards: Board[] = allBoards.map(b => ({
      id: b.id,
      title: b.title,
      user_id: b.user_id,
      labels: parseLabels(b.labels),
      position: b.position || 0,
    }));
    
    // Position bazlı sıralama, eğer position yoksa (veya 0 ise) eklendiği sıraya göre (zaten yukarda sıralandı)
    mappedBoards.sort((a, b) => (a.position || 0) - (b.position || 0));

    const firstBoardId = mappedBoards[0]?.id || null;

    if (!firstBoardId) {
      set({ boards: mappedBoards, activeBoardId: null, columns: [], tasks: [], isLoading: false });
      return;
    }

    // Sütunlar
    const { data: cols } = await supabase
      .from('columns')
      .select('*')
      .in('board_id', mappedBoards.map(b => b.id))
      .order('position', { ascending: true });

    const mappedCols: Column[] = (cols || []).map(c => ({
      id: c.id,
      boardId: c.board_id,
      title: c.title,
      position: c.position,
    }));

    // Görevler
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .in('board_id', mappedBoards.map(b => b.id))
      .order('position', { ascending: true });

    const mappedTasks: Task[] = (tasks || []).map(t => ({
      id: t.id,
      boardId: t.board_id,
      columnId: t.column_id,
      title: t.title,
      description: t.description || '',
      dueDate: t.due_date || '',
      tags: t.tags || [],
      assignee: t.assignee || '',
      checklist: t.checklist || [],
      position: t.position,
      _dbColumnId: t.column_id,
      _dbPosition: t.position,
    }));

    set({
      boards: mappedBoards,
      activeBoardId: firstBoardId,
      columns: mappedCols,
      tasks: mappedTasks,
      isLoading: false,
    });
    
    if (firstBoardId) {
      get().fetchMembers(firstBoardId);
    }

    // Realtime aboneliğini başlat
    get().subscribeToRealtime(mappedBoards.map(b => b.id));
  },

  setActiveBoard: (id) => {
    set({ activeBoardId: id });
    get().fetchMembers(id);
  },

  addBoard: async (userId, title) => {
    const { boards } = get();
    const position = boards.length;

    const { data, error } = await supabase
      .from('boards')
      .insert({ user_id: userId, title, position })
      .select()
      .single();

    if (error || !data) {
      console.error('Pano eklenirken hata oluştu:', error);
      alert('Pano oluşturulamadı: ' + (error?.message || 'Bilinmeyen bir hata oluştu. Lütfen RLS (Veritabanı Güvenlik) kurallarını kontrol edin.'));
      return;
    }

    const newBoard: Board = { id: data.id, title: data.title, user_id: data.user_id, labels: parseLabels(data.labels), position: data.position };

    // Yeni panoya varsayılan sütunlar ekle
    const defaultCols = [
      { board_id: data.id, title: 'To Do', position: 0 },
      { board_id: data.id, title: 'In Progress', position: 1 },
      { board_id: data.id, title: 'Done', position: 2 },
    ];
    const { data: insertedCols } = await supabase.from('columns').insert(defaultCols).select();
    const mappedCols: Column[] = (insertedCols || []).map(c => ({
      id: c.id, boardId: c.board_id, title: c.title, position: c.position,
    }));

    set(state => ({
      boards: [...state.boards, newBoard],
      activeBoardId: data.id,
      columns: [...state.columns, ...mappedCols],
    }));
  },

  deleteBoard: async (id) => {
    await supabase.from('boards').delete().eq('id', id);
    set(state => {
      const newBoards = state.boards.filter(b => b.id !== id);
      return {
        boards: newBoards,
        activeBoardId: state.activeBoardId === id ? (newBoards[0]?.id || null) : state.activeBoardId,
        columns: state.columns.filter(c => c.boardId !== id),
        tasks: state.tasks.filter(t => t.boardId !== id),
      };
    });
  },

  updateBoardTitle: async (id, title) => {
    if (!title.trim()) return;
    const { boards } = get();
    const oldBoard = boards.find(b => b.id === id);
    await supabase.from('boards').update({ title: title.trim() }).eq('id', id);
    set(state => ({
      boards: state.boards.map(b => b.id === id ? { ...b, title: title.trim() } : b),
    }));
    if (oldBoard) get()._logActivity(id, 'board_renamed', 'board', id, title.trim(), { old_title: oldBoard.title, new_title: title.trim() });
  },

  reorderBoards: async (newOrder) => {
    set({ boards: newOrder });
    await Promise.all(
      newOrder.map((board, index) =>
        supabase.from('boards').update({ position: index }).eq('id', board.id)
      )
    );
  },

  inviteToBoard: async (boardId, email, role) => {
    try {
      const { error } = await supabase
        .from('board_members')
        .insert({ board_id: boardId, user_email: email, role });
      if (error) {
        if (error.code === '23505') return { success: false, error: 'Kullanıcı zaten bu panoda.' };
        return { success: false, error: error.message };
      }
      get().fetchMembers(boardId);
      get()._logActivity(boardId, 'member_invited', 'member', undefined, email, { role });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  fetchMembers: async (boardId) => {
    const { data } = await supabase.from('board_members').select('*').eq('board_id', boardId);
    
    const { user } = useAuthStore.getState();
    const board = get().boards.find(b => b.id === boardId);
    
    let role: 'viewer' | 'editor' | 'owner' = 'viewer';
    if (board?.user_id === user?.id) {
      role = 'owner';
    } else {
      const myMember = data?.find(m => m.user_email === user?.email);
      if (myMember) role = myMember.role as 'viewer' | 'editor';
    }

    set({ members: data || [], currentUserRole: role });
  },

  updateMemberRole: async (memberId, role) => {
    await supabase.from('board_members').update({ role }).eq('id', memberId);
    const { activeBoardId } = get();
    if (activeBoardId) get().fetchMembers(activeBoardId);
  },

  removeMember: async (memberId) => {
    await supabase.from('board_members').delete().eq('id', memberId);
    const { activeBoardId } = get();
    if (activeBoardId) get().fetchMembers(activeBoardId);
  },

  setColumns: (columns) => set({ columns }),
  setTasks: (tasks) => set({ tasks }),

  addColumn: async (boardId, title) => {
    const { columns } = get();
    const boardCols = columns.filter(c => c.boardId === boardId);
    const position = boardCols.length;

    const { data, error } = await supabase
      .from('columns')
      .insert({ board_id: boardId, title, position })
      .select().single();

    if (error || !data) return;
    const newCol: Column = { id: data.id, boardId: data.board_id, title: data.title, position: data.position };
    set(state => ({ columns: [...state.columns, newCol] }));
    get()._logActivity(boardId, 'column_created', 'column', data.id, title);
  },

  deleteColumn: async (id) => {
    const { columns, activeBoardId } = get();
    const col = columns.find(c => c.id === id);
    await supabase.from('columns').delete().eq('id', id);
    set(state => ({
      columns: state.columns.filter(c => c.id !== id),
      tasks: state.tasks.filter(t => t.columnId !== id),
    }));
    if (col && activeBoardId) get()._logActivity(activeBoardId, 'column_deleted', 'column', id, col.title);
  },

  updateColumn: async (id, title) => {
    const { columns, activeBoardId } = get();
    const oldCol = columns.find(c => c.id === id);
    await supabase.from('columns').update({ title }).eq('id', id);
    set(state => ({
      columns: state.columns.map(c => c.id === id ? { ...c, title } : c),
    }));
    if (activeBoardId && oldCol && oldCol.title !== title)
      get()._logActivity(activeBoardId, 'column_renamed', 'column', id, title, { old_title: oldCol.title, new_title: title });
  },

  reorderColumns: async (boardId, newOrder) => {
    // Optimistik güncelleme
    set(state => ({
      columns: [
        ...state.columns.filter(c => c.boardId !== boardId),
        ...newOrder.map((c, i) => ({ ...c, position: i })),
      ],
    }));
    // DB güncelleme
    await Promise.all(
      newOrder.map((col, index) =>
        supabase.from('columns').update({ position: index }).eq('id', col.id)
      )
    );
  },

  addTask: async (boardId, columnId, title, description = '', dueDate = '', tags = [], assignee = '') => {
    const { tasks } = get();
    const colTasks = tasks.filter(t => t.columnId === columnId);
    const position = colTasks.length;

    const { data, error } = await supabase
      .from('tasks')
      .insert({ board_id: boardId, column_id: columnId, title, description, due_date: dueDate || null, tags, assignee, position })
      .select().single();

    if (error || !data) return;
    const newTask: Task = {
      id: data.id, boardId: data.board_id, columnId: data.column_id,
      title: data.title, description: data.description || '',
      dueDate: data.due_date || '', tags: data.tags || [], assignee: data.assignee || '',
      checklist: data.checklist || [],
      position: data.position,
      _dbColumnId: data.column_id,
      _dbPosition: data.position,
    };
    set(state => ({ tasks: [...state.tasks, newTask] }));
    get()._logActivity(boardId, 'task_created', 'task', data.id, title);
  },

  deleteTask: async (id) => {
    const { tasks, activeBoardId } = get();
    const task = tasks.find(t => t.id === id);
    await supabase.from('tasks').delete().eq('id', id);
    set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
    if (task && activeBoardId) get()._logActivity(activeBoardId, 'task_deleted', 'task', id, task.title);
  },

  updateTask: async (id, title, description, dueDate = '', tags = [], assignee = '', checklist = []) => {
    const { activeBoardId } = get();
    await supabase.from('tasks').update({
      title, description, due_date: dueDate || null, tags, assignee, checklist
    }).eq('id', id);
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, title, description, dueDate, tags, assignee, checklist } : t),
    }));
    if (activeBoardId) get()._logActivity(activeBoardId, 'task_updated', 'task', id, title);
  },

  moveTask: async (taskId, toColumnId) => {
    await supabase.from('tasks').update({ column_id: toColumnId }).eq('id', taskId);
    set(state => ({
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, columnId: toColumnId } : t),
    }));
  },

  updateBoardLabels: async (boardId, newLabels, oldLabelName, newLabelName) => {
    // DB güncelleme
    await supabase.from('boards').update({ labels: newLabels }).eq('id', boardId);
    
    // Board state güncelleme
    set(state => ({
      boards: state.boards.map(b => b.id === boardId ? { ...b, labels: newLabels } : b)
    }));

    // Eğer eski etiket değiştirildiyse (veya silindiyse), task'leri de güncelle
    if (oldLabelName) {
      const { tasks } = get();
      const boardTasksToUpdate = tasks.filter(t => t.boardId === boardId && (t.tags || []).includes(oldLabelName));
      
      if (boardTasksToUpdate.length > 0) {
        // Yeni görev listesini oluştur
        const updatedTasksState = tasks.map(t => {
          if (t.boardId === boardId && (t.tags || []).includes(oldLabelName)) {
            let newTags = [...(t.tags || [])];
            if (newLabelName) {
              // İsim değişikliği
              newTags = newTags.map(tag => tag === oldLabelName ? newLabelName : tag);
            } else {
              // Silme işlemi
              newTags = newTags.filter(tag => tag !== oldLabelName);
            }
            return { ...t, tags: newTags };
          }
          return t;
        });

        // State'i güncelle
        set({ tasks: updatedTasksState });

        // DB'de toplu güncelleme
        await Promise.all(
          boardTasksToUpdate.map(t => {
            let updatedTags = [...(t.tags || [])];
            if (newLabelName) {
              updatedTags = updatedTags.map(tag => tag === oldLabelName ? newLabelName : tag);
            } else {
              updatedTags = updatedTags.filter(tag => tag !== oldLabelName);
            }
            return supabase.from('tasks').update({ tags: updatedTags }).eq('id', t.id);
          })
        );
      }
    }
  },

  syncTaskOrder: async (boardId) => {
    const { tasks, columns } = get();
    const boardTasks = tasks.filter(t => t.boardId === boardId);
    
    const updatedTasks = [...tasks];
    const promises: Promise<any>[] = [];
    const moveLogItems: { taskTitle: string; fromCol: string; toCol: string }[] = [];

    const columnGroups: Record<string, Task[]> = {};
    boardTasks.forEach(t => {
      if (!columnGroups[t.columnId]) columnGroups[t.columnId] = [];
      columnGroups[t.columnId].push(t);
    });

    Object.entries(columnGroups).forEach(([colId, colTasks]) => {
      colTasks.forEach((task, index) => {
        if (task._dbColumnId !== colId || task._dbPosition !== index) {
          const taskIdx = updatedTasks.findIndex(t => t.id === task.id);
          if (taskIdx !== -1) {
            updatedTasks[taskIdx] = { 
              ...updatedTasks[taskIdx], 
              position: index, 
              columnId: colId,
              _dbColumnId: colId,
              _dbPosition: index
            };
          }
          // Sütun degisikligini tespit et (sıralama değil sadece kolon değişimi)
          if (task._dbColumnId && task._dbColumnId !== colId) {
            const fromColTitle = columns.find(c => c.id === task._dbColumnId)?.title || '?';
            const toColTitle = columns.find(c => c.id === colId)?.title || '?';
            moveLogItems.push({ taskTitle: task.title, fromCol: fromColTitle, toCol: toColTitle });
          }
          promises.push(
            supabase.from('tasks').update({ column_id: colId, position: index }).eq('id', task.id) as unknown as Promise<any>
          );
        }
      });
    });

    if (promises.length > 0) {
      set({ tasks: updatedTasks });
      await Promise.all(promises);
      // Log kart taşıma olayları
      for (const item of moveLogItems) {
        get()._logActivity(boardId, 'task_moved', 'task', undefined, item.taskTitle, { from_column: item.fromCol, to_column: item.toCol });
      }
    }
  },

  // ─── Realtime ───────────────────────────────────────────────────
  subscribeToRealtime: (boardIds) => {
    // Önceki kanalı temizle
    get().unsubscribeFromRealtime();

    if (boardIds.length === 0) return;

    const channel = supabase
      .channel('notsen-realtime')

      // ── TASKS ──
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tasks' },
        (payload) => {
          const d = payload.new as any;
          if (!boardIds.includes(d.board_id)) return;
          const newTask: Task = {
            id: d.id, boardId: d.board_id, columnId: d.column_id,
            title: d.title, description: d.description || '',
            dueDate: d.due_date || '', tags: d.tags || [], assignee: d.assignee || '',
            position: d.position, _dbColumnId: d.column_id, _dbPosition: d.position,
          };
          set(state => {
            // Zaten varsa ekleme (kendi eklediğimiz)
            if (state.tasks.some(t => t.id === newTask.id)) return state;
            return { tasks: [...state.tasks, newTask] };
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tasks' },
        (payload) => {
          const d = payload.new as any;
          if (!boardIds.includes(d.board_id)) return;
          const { isDragging } = get();
          set(state => ({
            tasks: state.tasks.map(t => {
              if (t.id !== d.id) return t;
              // Sürükleme sırasında pozisyon/sütun değişikliklerini atla
              // (görsel çakışma olmasın), sadece içerik güncellemelerini uygula
              if (isDragging) {
                return {
                  ...t,
                  title: d.title,
                  description: d.description || '',
                  dueDate: d.due_date || '',
                  tags: d.tags || [],
                  assignee: d.assignee || '',
                  checklist: d.checklist || [],
                };
              }
              return {
                ...t,
                title: d.title,
                description: d.description || '',
                dueDate: d.due_date || '',
                tags: d.tags || [],
                assignee: d.assignee || '',
                checklist: d.checklist || [],
                columnId: d.column_id,
                position: d.position,
                _dbColumnId: d.column_id,
                _dbPosition: d.position,
              };
            }),
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'tasks' },
        (payload) => {
          const d = payload.old as any;
          set(state => ({ tasks: state.tasks.filter(t => t.id !== d.id) }));
        }
      )

      // ── COLUMNS ──
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'columns' },
        (payload) => {
          const d = payload.new as any;
          if (!boardIds.includes(d.board_id)) return;
          const newCol: Column = { id: d.id, boardId: d.board_id, title: d.title, position: d.position };
          set(state => {
            if (state.columns.some(c => c.id === newCol.id)) return state;
            return { columns: [...state.columns, newCol] };
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'columns' },
        (payload) => {
          const d = payload.new as any;
          if (!boardIds.includes(d.board_id)) return;
          set(state => ({
            columns: state.columns.map(c =>
              c.id === d.id ? { ...c, title: d.title, position: d.position } : c
            ),
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'columns' },
        (payload) => {
          const d = payload.old as any;
          set(state => ({
            columns: state.columns.filter(c => c.id !== d.id),
            tasks: state.tasks.filter(t => t.columnId !== d.id),
          }));
        }
      )

      // ── BOARDS (etiket güncellemeleri için) ──
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'boards' },
        (payload) => {
          const d = payload.new as any;
          if (!boardIds.includes(d.id)) return;
          set(state => {
            const updatedBoards = state.boards.map(b =>
              b.id === d.id ? { ...b, title: d.title, labels: parseLabels(d.labels), position: d.position } : b
            );
            return { boards: updatedBoards.sort((a, b) => (a.position || 0) - (b.position || 0)) };
          });
        }
      )

      .subscribe();

    // Kanalı dışarıdan erişilebilir yere sakla
    (get() as any)._realtimeChannel = channel;
  },

  unsubscribeFromRealtime: () => {
    const ch = (get() as any)._realtimeChannel;
    if (ch) {
      supabase.removeChannel(ch);
      (get() as any)._realtimeChannel = null;
    }
  },
}));
