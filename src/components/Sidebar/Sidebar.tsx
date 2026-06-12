import React, { useState } from 'react';
import Image from 'next/image';
import { useBoardStore, ThemeName, Board } from '@/store/useBoardStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Plus, LayoutDashboard, Trash2, LogOut, UserCircle, GripVertical, CheckSquare, Calendar, MessageSquare } from 'lucide-react';
import { useActiveBoard } from '@/hooks/useActiveBoard';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from './Sidebar.module.css';
import { usePathname, useRouter } from 'next/navigation';
import { useMobileSidebar } from '@/contexts/MobileSidebarContext';
import { useWorkspace } from '@/hooks/api/useWorkspace';
import { useBoardMutations } from '@/hooks/api/useBoardMutations';
import BoardTemplateModal from '@/components/Board/BoardTemplateModal';

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
      className={`${styles.boardItem} ${isActive ? styles.active : ''} ${isDragging ? styles.dragging : ''}`}
    >
      <div {...attributes} {...listeners} className={styles.boardDragHandle}>
        <GripVertical size={14} />
      </div>
      <button className={styles.boardLink} onClick={onSelect}>
        <LayoutDashboard size={18} />
        <span className={styles.boardTitle}>{board.title}</span>
      </button>
      {showDelete && (
        <button className={styles.deleteBtn} onClick={onDelete} title="Panoyu Sil">
          <Trash2 size={16} />
        </button>
      )}
    </li>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const activePage = pathname.startsWith('/profile')
    ? 'profile'
    : pathname.startsWith('/tasks')
      ? 'tasks'
      : pathname.startsWith('/notes')
        ? 'notes'
        : pathname.startsWith('/calendar')
          ? 'calendar'
          : 'boards';
  const { isOpen, closeSidebar } = useMobileSidebar();

  const { theme, setTheme } = useBoardStore();
  const { activeBoardId, setActiveBoard } = useActiveBoard();
  const { user, logout } = useAuthStore();
  const { data: workspace } = useWorkspace(user?.id ?? null, user?.email ?? null);
  const boards = workspace?.boards ?? [];
  const { addBoard, deleteBoard, reorderBoards } = useBoardMutations();

  const [isTemplateOpen, setIsTemplateOpen] = useState(false);

  const THEMES: { id: ThemeName; label: string; swatch: string }[] = [
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

  const handleCreateBoard = (title: string, templateId: string) => {
    addBoard.mutate({ title, templateId }, {
      onSuccess: ({ board }) => {
        setIsTemplateOpen(false);
        setActiveBoard(board.id);
        closeSidebar();
        router.push(`/boards/${board.id}`);
      },
    });
  };

  const handleThemeChange = (t: ThemeName) => {
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
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
    <>
      <div
        className={`${styles.sidebarOverlay} ${isOpen ? styles.overlayActive : ''}`}
        onClick={closeSidebar}
      />
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <Image src="/icon.png" alt="Notsen Logo" width={28} height={28} style={{ borderRadius: '6px' }} />
            <h1>Notsen</h1>
          </div>
        </div>

        <nav className={styles.nav}>
          <button
            className={`${styles.navBtn} ${activePage === 'boards' ? styles.navBtnActive : ''}`}
            onClick={() => { closeSidebar(); router.push('/boards'); }}
          >
            <LayoutDashboard size={18} /> Panolarım
          </button>
          <button
            className={`${styles.navBtn} ${activePage === 'tasks' ? styles.navBtnActive : ''}`}
            onClick={() => { closeSidebar(); router.push('/tasks'); }}
          >
            <CheckSquare size={18} /> Görevlerim
          </button>
          <button
            className={`${styles.navBtn} ${activePage === 'calendar' ? styles.navBtnActive : ''}`}
            onClick={() => { closeSidebar(); router.push('/calendar'); }}
          >
            <Calendar size={18} /> Takvim
          </button>
          <button
            className={`${styles.navBtn} ${activePage === 'notes' ? styles.navBtnActive : ''}`}
            onClick={() => { closeSidebar(); router.push('/notes'); }}
          >
            <MessageSquare size={18} /> Hızlı Notlar
          </button>
          <button
            className={`${styles.navBtn} ${activePage === 'profile' ? styles.navBtnActive : ''}`}
            onClick={() => { closeSidebar(); router.push('/profile'); }}
          >
            <UserCircle size={18} /> Profilim
          </button>
        </nav>

        {activePage === 'boards' && (
          <div className={styles.boardsSection}>
            <div className={styles.sectionHeader}>
              <h3>PANOLARIM ({boards.length})</h3>
              <button className={styles.iconBtn} onClick={() => setIsTemplateOpen(true)} title="Yeni Pano Ekle">
                <Plus size={16} />
              </button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={boards.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                <ul className={styles.boardList}>
                  {boards.map((board) => (
                    <SortableBoardItem
                      key={board.id}
                      board={board}
                      isActive={board.id === activeBoardId}
                      onSelect={() => {
                        setActiveBoard(board.id);
                        closeSidebar();
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
        )}

        <div className={styles.footer}>
          <div className={styles.themePicker}>
            <span className={styles.themePickerLabel}>Tema</span>
            <div className={styles.themeSwatches}>
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t.id)}
                  className={`${styles.themeSwatch} ${theme === t.id ? styles.themeSwatchActive : ''}`}
                  title={t.label}
                  style={{ background: t.swatch }}
                />
              ))}
            </div>
          </div>

          <div className={styles.userInfo}>
            <div className={styles.avatar}>{user?.email?.charAt(0).toUpperCase()}</div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user?.email}</span>
              <button onClick={() => logout()} className={styles.logoutBtn}>
                <LogOut size={14} /> Çıkış
              </button>
            </div>
          </div>
        </div>
      </aside>
      {isTemplateOpen && (
        <BoardTemplateModal
          onClose={() => setIsTemplateOpen(false)}
          onCreate={handleCreateBoard}
          isPending={addBoard.isPending}
        />
      )}
    </>
  );
}
