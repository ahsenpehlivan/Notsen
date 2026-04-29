import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export type Id = string;

export interface Board {
  id: Id;
  title: string;
  user_id?: string;
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
  position: number;
}

interface BoardState {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;

  isLoading: boolean;
  boards: Board[];
  activeBoardId: Id | null;
  columns: Column[];
  tasks: Task[];

  loadUserData: (userId: string, email: string) => Promise<void>;

  addBoard: (userId: string, title: string) => Promise<void>;
  deleteBoard: (id: Id) => Promise<void>;
  setActiveBoard: (id: Id) => void;
  inviteToBoard: (boardId: Id, email: string) => Promise<{ success: boolean; error?: string }>;

  setColumns: (columns: Column[]) => void;
  setTasks: (tasks: Task[]) => void;
  addColumn: (boardId: Id, title: string) => Promise<void>;
  deleteColumn: (id: Id) => Promise<void>;
  updateColumn: (id: Id, title: string) => Promise<void>;
  reorderColumns: (boardId: Id, newOrder: Column[]) => Promise<void>;

  addTask: (boardId: Id, columnId: Id, title: string, description?: string, dueDate?: string, tags?: string[], assignee?: string) => Promise<void>;
  deleteTask: (id: Id) => Promise<void>;
  updateTask: (id: Id, title: string, description: string, dueDate?: string, tags?: string[], assignee?: string) => Promise<void>;
  moveTask: (taskId: Id, toColumnId: Id) => Promise<void>;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const getSavedTheme = (): 'dark' | 'light' => {
  if (typeof window === 'undefined') return 'dark';
  return (localStorage.getItem('taskflow-theme') as 'dark' | 'light') || 'dark';
};

export const useBoardStore = create<BoardState>((set, get) => ({
  theme: 'dark',
  setTheme: (theme) => {
    if (typeof window !== 'undefined') localStorage.setItem('taskflow-theme', theme);
    set({ theme });
  },

  isLoading: false,
  boards: [],
  activeBoardId: null,
  columns: [],
  tasks: [],

  loadUserData: async (userId: string, email: string) => {
    set({ isLoading: true });

    const savedTheme = getSavedTheme();
    set({ theme: savedTheme });

    // Sahip olunan panolar
    const { data: ownedBoards } = await supabase
      .from('boards')
      .select('*')
      .eq('user_id', userId)
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
    }));

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
      position: t.position,
    }));

    set({
      boards: mappedBoards,
      activeBoardId: firstBoardId,
      columns: mappedCols,
      tasks: mappedTasks,
      isLoading: false,
    });
  },

  setActiveBoard: (id) => set({ activeBoardId: id }),

  addBoard: async (userId, title) => {
    const { data, error } = await supabase
      .from('boards')
      .insert({ user_id: userId, title })
      .select()
      .single();

    if (error || !data) return;

    const newBoard: Board = { id: data.id, title: data.title, user_id: data.user_id };

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

  inviteToBoard: async (boardId, email) => {
    try {
      const { error } = await supabase
        .from('board_members')
        .insert({ board_id: boardId, user_email: email });
      if (error) {
        if (error.code === '23505') return { success: false, error: 'Kullanıcı zaten bu panoda.' };
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
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
  },

  deleteColumn: async (id) => {
    await supabase.from('columns').delete().eq('id', id);
    set(state => ({
      columns: state.columns.filter(c => c.id !== id),
      tasks: state.tasks.filter(t => t.columnId !== id),
    }));
  },

  updateColumn: async (id, title) => {
    await supabase.from('columns').update({ title }).eq('id', id);
    set(state => ({
      columns: state.columns.map(c => c.id === id ? { ...c, title } : c),
    }));
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
      position: data.position,
    };
    set(state => ({ tasks: [...state.tasks, newTask] }));
  },

  deleteTask: async (id) => {
    await supabase.from('tasks').delete().eq('id', id);
    set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
  },

  updateTask: async (id, title, description, dueDate = '', tags = [], assignee = '') => {
    await supabase.from('tasks').update({
      title, description, due_date: dueDate || null, tags, assignee
    }).eq('id', id);
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, title, description, dueDate, tags, assignee } : t),
    }));
  },

  moveTask: async (taskId, toColumnId) => {
    await supabase.from('tasks').update({ column_id: toColumnId }).eq('id', taskId);
    set(state => ({
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, columnId: toColumnId } : t),
    }));
  },
}));
