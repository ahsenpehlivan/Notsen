'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Plus, LayoutDashboard, CheckSquare, Trash2, GripVertical, Calendar } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkspace } from '@/hooks/api/useWorkspace';
import { useActiveBoard } from '@/hooks/useActiveBoard';
import { useBoardMutations } from '@/hooks/api/useBoardMutations';
import { Board, ThemeName, useBoardStore } from '@/store/useBoardStore';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import BoardTemplateModal from '@/components/Board/BoardTemplateModal';
import styles from './Navigation.module.css';
import boardStyles from '@/components/Sidebar/Sidebar.module.css';

interface SortableBoardItemProps {
  board: Board;
  isActive: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  showDelete: boolean;
}

function SortableBoardItem({ board, isActive, onSelect, onDelete, showDelete }: SortableBoardItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: board.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { zIndex: 100, position: 'relative' as const } : {}),
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`${boardStyles.boardItem} ${isActive ? boardStyles.active : ''} ${isDragging ? boardStyles.dragging : ''}`}
    >
      <div {...attributes} {...listeners} className={boardStyles.boardDragHandle}>
        <GripVertical size={14} />
      </div>
      <button className={boardStyles.boardLink} onClick={onSelect} style={{ border: 'none', background: 'transparent', flex: 1, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'inherit' }}>
        <LayoutDashboard size={16} />
        <span className={boardStyles.boardTitle} style={{ fontSize: '0.85rem' }}>{board.title}</span>
      </button>
      {showDelete && (
        <button className={boardStyles.deleteBtn} onClick={onDelete} title="Panoyu Sil">
          <Trash2 size={14} />
        </button>
      )}
    </li>
  );
}

export default function KanbanSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { data: workspace } = useWorkspace(user?.id ?? null, user?.email ?? null);
  const boards = workspace?.boards ?? [];
  const { addBoard, deleteBoard, reorderBoards } = useBoardMutations();
  const { activeBoardId, setActiveBoard } = useActiveBoard();
  const { theme, setTheme } = useBoardStore();

  const [isTemplateOpen, setIsTemplateOpen] = useState(false);

  const THEMES: { id: ThemeName; label: string; swatch: string }[] = [
    { id: 'charcoal', label: 'Charcoal', swatch: '#221c1c' },
    { id: 'midnight', label: 'Midnight', swatch: '#161B22' },
    { id: 'deep-ocean', label: 'Deep Ocean', swatch: '#0A1128' },
    { id: 'nordic', label: 'Nordic', swatch: '#88C0D0' },
  ];

  const handleCreateBoard = (title: string, templateId: string) => {
    addBoard.mutate({ title, templateId }, {
      onSuccess: ({ board }) => {
        setIsTemplateOpen(false);
        setActiveBoard(board.id);
        router.push(`/boards/${board.id}`);
      },
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = boards.findIndex((b) => b.id === active.id);
    const newIndex = boards.findIndex((b) => b.id === over.id);
    reorderBoards.mutate(arrayMove(boards, oldIndex, newIndex));
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader} style={{ marginTop: '0.5rem' }}>
        <span>İş Yönetimi</span>
      </div>

      <nav className={styles.sidebarNav}>
        <button 
          className={`${styles.navItem} ${pathname.startsWith('/tasks') ? styles.navItemActive : ''}`}
          onClick={() => router.push('/tasks')}
        >
          <CheckSquare size={16} /> Görevlerim
        </button>
        <button 
          className={`${styles.navItem} ${pathname.startsWith('/calendar') ? styles.navItemActive : ''}`}
          onClick={() => router.push('/calendar')}
        >
          <Calendar size={16} /> Takvim
        </button>
      </nav>

      <div className={styles.sidebarHeader} style={{ marginTop: '1rem', borderTop: '1px solid var(--glass-border-subtle)', paddingTop: '1rem' }}>
        <span>Panolarım ({boards.length})</span>
        <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setIsTemplateOpen(true)}>
          <Plus size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0.5rem' }}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={boards.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {boards.map((board) => (
                <SortableBoardItem
                  key={board.id}
                  board={board}
                  isActive={board.id === activeBoardId && pathname.startsWith('/boards')}
                  onSelect={() => {
                    setActiveBoard(board.id);
                    router.push(`/boards/${board.id}`);
                  }}
                  showDelete={boards.length > 1}
                  onDelete={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`"${board.title}" panosunu silmek istediğinize emin misiniz?`)) {
                      deleteBoard.mutate(board.id);
                    }
                  }}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>

      <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border-subtle)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Temalar</div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTheme(t.id);
                document.documentElement.setAttribute('data-theme', t.id);
              }}
              style={{
                width: 24, height: 24, borderRadius: '50%', background: t.swatch, border: theme === t.id ? '2px solid var(--accent-primary)' : '2px solid transparent', cursor: 'pointer'
              }}
              title={t.label}
            />
          ))}
        </div>
      </div>

      {isTemplateOpen && (
        <BoardTemplateModal
          onClose={() => setIsTemplateOpen(false)}
          onCreate={handleCreateBoard}
          isPending={addBoard.isPending}
        />
      )}
    </aside>
  );
}
