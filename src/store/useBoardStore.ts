import { create } from 'zustand';
import type { ThemeName } from '@/types/board';

export type {
  Id,
  ThemeName,
  ChecklistItem,
  TaskComment,
  ActivityLog,
  BoardLabel,
  Board,
  BoardMember,
  Column,
  Task,
} from '@/types/board';

export { PASTEL_COLORS } from '@/lib/board-mappers';

const VALID_THEMES: ThemeName[] = [
  'charcoal', 'midnight', 'cream-slate', 'stone-indigo', 'warm-linen',
  'cyberpunk', 'nordic', 'sakura', 'hacker', 'sunset',
  'deep-ocean', 'high-contrast', 'amber-wood',
];

const getSavedTheme = (): ThemeName => {
  if (typeof window === 'undefined') return 'charcoal';
  const saved = localStorage.getItem('notsen-theme') as ThemeName;
  if (VALID_THEMES.includes(saved)) return saved;
  const legacy = localStorage.getItem('taskflow-theme') as ThemeName;
  return VALID_THEMES.includes(legacy) ? legacy : 'charcoal';
};

interface BoardUIState {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  activeBoardId: string | null;
  setActiveBoard: (id: string) => void;
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
}

export const useBoardStore = create<BoardUIState>((set) => ({
  theme: typeof window !== 'undefined' ? getSavedTheme() : 'charcoal',
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notsen-theme', theme);
      localStorage.setItem('taskflow-theme', theme);
    }
    set({ theme });
  },
  activeBoardId: null,
  setActiveBoard: (id) => set({ activeBoardId: id }),
  isDragging: false,
  setIsDragging: (v) => set({ isDragging: v }),
}));
