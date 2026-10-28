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

export const THEMES: { id: ThemeName; label: string; swatch: string }[] = [
  { id: 'charcoal', label: 'Charcoal', swatch: '#221c1c' },
  { id: 'midnight', label: 'Midnight', swatch: '#161B22' },
  { id: 'cream-slate', label: 'Cream & Slate', swatch: '#c8bfa8' },
  { id: 'stone-indigo', label: 'Stone & Indigo', swatch: '#4361EE' },
  { id: 'warm-linen', label: 'Warm Linen', swatch: '#d4c5a9' },
  { id: 'cyberpunk', label: 'Cyberpunk', swatch: '#f000ff' },
  { id: 'nordic', label: 'Nordic', swatch: '#88C0D0' },
  { id: 'sakura', label: 'Sakura', swatch: '#FF6699' },
  { id: 'hacker', label: 'Hacker', swatch: '#00FF00' },
  { id: 'sunset', label: 'Sunset', swatch: '#FF6B6B' },
  { id: 'deep-ocean', label: 'Deep Ocean', swatch: '#0A1128' },
  { id: 'high-contrast', label: 'High Contrast', swatch: '#FFFF00' },
  { id: 'amber-wood', label: 'Amber Wood', swatch: '#E67E22' },
];

const VALID_THEMES: ThemeName[] = THEMES.map((t) => t.id);

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
      document.documentElement.setAttribute('data-theme', theme);
    }
    set({ theme });
  },
  activeBoardId: null,
  setActiveBoard: (id) => set({ activeBoardId: id }),
  isDragging: false,
  setIsDragging: (v) => set({ isDragging: v }),
}));
