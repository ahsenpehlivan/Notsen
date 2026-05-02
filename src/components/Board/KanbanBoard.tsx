import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useBoardStore, Task } from '@/store/useBoardStore';
import BoardColumn from './BoardColumn';
import BoardCard from './BoardCard';
import { Plus, Settings2, Menu, UserPlus, Tag, Search, X, ChevronDown, Activity } from 'lucide-react';
import styles from './Board.module.css';
import CardModal from './CardModal';
import ColumnReorderModal from './ColumnReorderModal';
import InviteModal from './InviteModal';
import LabelsManagerModal from './LabelsManagerModal';
import ActivityPanel from './ActivityPanel';

interface KanbanBoardProps {
  onOpenMenu?: () => void;
}

export default function KanbanBoard({ onOpenMenu }: KanbanBoardProps = {}) {
  const { activeBoardId, boards, columns, tasks, setColumns, setTasks, addColumn, currentUserRole, setIsDragging, updateBoardTitle } = useBoardStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [isReorderingColumns, setIsReorderingColumns] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isLabelsManagerOpen, setIsLabelsManagerOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);

  // Board title inline editing
  const [isEditingBoardTitle, setIsEditingBoardTitle] = useState(false);
  const [boardTitleDraft, setBoardTitleDraft] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLabels, setFilterLabels] = useState<string[]>([]);
  const [filterAssignee, setFilterAssignee] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const isViewer = currentUserRole === 'viewer';

  const boardColumns = columns.filter((c) => c.boardId === activeBoardId);
  const boardTasks = tasks.filter((t) => t.boardId === activeBoardId);

  // Filtreli görevler
  const filteredTasks = boardTasks.filter(task => {
    const q = searchQuery.toLowerCase().trim();
    if (q && !task.title.toLowerCase().includes(q) && !task.description?.toLowerCase().includes(q)) return false;
    if (filterLabels.length > 0 && !filterLabels.every(l => (task.tags || []).includes(l))) return false;
    if (filterAssignee && task.assignee !== filterAssignee) return false;
    return true;
  });

  const hasActiveFilter = searchQuery.trim() !== '' || filterLabels.length > 0 || filterAssignee !== '';
  const filteredCount = boardTasks.length - filteredTasks.length;

  // Mevcut tüm sorumlu kişiler (bu panodaki görevlerden)
  const allAssignees = Array.from(new Set(boardTasks.map(t => t.assignee).filter(Boolean))) as string[];
  const activeBoard = boards.find(b => b.id === activeBoardId);
  const boardLabels = activeBoard?.labels || [];

  const toggleFilterLabel = (name: string) => {
    setFilterLabels(prev => prev.includes(name) ? prev.filter(l => l !== name) : [...prev, name]);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterLabels([]);
    setFilterAssignee('');
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (isViewer) return;
    const { active } = event;
    const task = boardTasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
      setIsDragging(true);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    // Sütun değiştirme durumu (Kartı başka bir karta sürüklediğimizde)
    if (isActiveTask && isOverTask) {
      useBoardStore.setState((state) => {
        const activeTaskIndex = state.tasks.findIndex(t => t.id === activeId);
        const overTaskIndex = state.tasks.findIndex(t => t.id === overId);
        
        if (activeTaskIndex === -1 || overTaskIndex === -1) return state;

        const activeTask = state.tasks[activeTaskIndex];
        const overTask = state.tasks[overTaskIndex];

        if (activeTask.columnId !== overTask.columnId) {
          const newTasks = [...state.tasks];
          newTasks[activeTaskIndex] = { ...newTasks[activeTaskIndex], columnId: overTask.columnId };
          return { tasks: arrayMove(newTasks, activeTaskIndex, overTaskIndex) };
        } else {
          // Aynı sütun içinde sıralama
          return { tasks: arrayMove(state.tasks, activeTaskIndex, overTaskIndex) };
        }
      });
    }

    // Kartı boş bir sütuna sürüklediğimizde
    if (isActiveTask && isOverColumn) {
      useBoardStore.setState((state) => {
        const activeTaskIndex = state.tasks.findIndex(t => t.id === activeId);
        const newTasks = [...state.tasks];
        newTasks[activeTaskIndex] = { ...newTasks[activeTaskIndex], columnId: String(overId) };
        // Sütunun sonuna ekle
        return { tasks: arrayMove(newTasks, activeTaskIndex, newTasks.length - 1) };
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    setIsDragging(false);
    if (isViewer || !activeBoardId) return;
    
    // DB senkronizasyonunu yap
    useBoardStore.getState().syncTaskOrder(activeBoardId);
  };

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (newColumnTitle.trim() && activeBoardId) {
      addColumn(activeBoardId, newColumnTitle.trim());
      setNewColumnTitle('');
      setIsAddingColumn(false);
    }
  };

  if (!activeBoardId || !activeBoard) {
    return (
      <div className={styles.boardContainer} style={{ alignItems: 'center', justifyContent: 'center' }}>
        {onOpenMenu && (
          <button className={styles.menuBtn} onClick={onOpenMenu} style={{ position: 'absolute', top: '1.25rem', left: '1.25rem' }}>
            <Menu size={24} />
          </button>
        )}
        <h2 style={{ color: 'var(--text-muted)' }}>Lütfen yandaki menüden bir pano seçin veya yeni pano oluşturun.</h2>
      </div>
    );
  }

  return (
    <div className={styles.boardContainer}>
      <header className={styles.boardHeader}>
        <div className={styles.boardHeaderLeft}>
          {onOpenMenu && (
            <button className={styles.menuBtn} onClick={onOpenMenu}>
              <Menu size={20} />
            </button>
          )}
          {isEditingBoardTitle && !isViewer ? (
            <input
              autoFocus
              className={styles.boardTitleInput}
              value={boardTitleDraft}
              onChange={e => setBoardTitleDraft(e.target.value)}
              onBlur={() => {
                if (boardTitleDraft.trim() && activeBoardId) updateBoardTitle(activeBoardId, boardTitleDraft);
                setIsEditingBoardTitle(false);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); }
                if (e.key === 'Escape') { setIsEditingBoardTitle(false); }
              }}
            />
          ) : (
            <h2
              onClick={() => {
                if (!isViewer) { setBoardTitleDraft(activeBoard.title); setIsEditingBoardTitle(true); }
              }}
              title={!isViewer ? 'Düzenlemek için tıklayın' : ''}
              style={!isViewer ? { cursor: 'text' } : {}}
            >
              {activeBoard.title}
            </h2>
          )}
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.addCardBtn}
            style={{ width: 'auto', padding: '0.5rem 1rem', background: isActivityOpen ? 'var(--accent-primary)' : 'var(--bg-tertiary)', color: isActivityOpen ? '#fff' : 'var(--text-secondary)' }}
            onClick={() => setIsActivityOpen(o => !o)}
          >
            <Activity size={16} /> <span className={styles.hideOnMobile}>Aktivite</span>
          </button>
          <button 
            className={styles.addCardBtn} 
            style={{ width: 'auto', padding: '0.5rem 1rem', background: 'var(--accent-subtle)', color: 'var(--accent-hover)' }}
            onClick={() => setIsInviteModalOpen(true)}
          >
            <UserPlus size={16} /> <span>Paylaş</span>
          </button>
          {!isViewer && (
            <>
              <button 
                className={styles.addCardBtn} 
                style={{ width: 'auto', padding: '0.5rem 1rem', background: 'var(--bg-tertiary)', marginRight: '8px' }}
                onClick={() => setIsLabelsManagerOpen(true)}
              >
                <Tag size={16} /> <span className={styles.hideOnMobile}>Etiketleri Düzenle</span>
              </button>
              <button 
                className={styles.addCardBtn} 
                style={{ width: 'auto', padding: '0.5rem 1rem', background: 'var(--bg-tertiary)' }}
                onClick={() => setIsReorderingColumns(true)}
              >
                <Settings2 size={16} /> <span className={styles.hideOnMobile}>Sütunları Düzenle</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── Search & Filter Bar ── */}
      <div className={styles.searchBar}>
        <div className={styles.searchInput}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Görev ara..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className={styles.clearInputBtn}><X size={13} /></button>
          )}
        </div>

        <button
          className={`${styles.filterToggleBtn} ${isFilterOpen ? styles.filterToggleBtnActive : ''}`}
          onClick={() => setIsFilterOpen(v => !v)}
        >
          Filtrele <ChevronDown size={14} style={{ transform: isFilterOpen ? 'rotate(180deg)' : 'rotate(0)', transition: '0.2s' }} />
          {hasActiveFilter && <span className={styles.filterDot} />}
        </button>

        {hasActiveFilter && (
          <button onClick={clearAllFilters} className={styles.clearFilterBtn}>
            <X size={13} /> Temizle
          </button>
        )}

        {hasActiveFilter && (
          <span className={styles.filterResultText}>
            {filteredCount > 0 ? `${filteredCount} görev gizlendi` : 'Tüm görevler görünüyor'}
          </span>
        )}
      </div>

      {isFilterOpen && (
        <div className={styles.filterPanel}>
          {boardLabels.length > 0 && (
            <div className={styles.filterGroup}>
              <span className={styles.filterGroupLabel}>Etiket</span>
              <div className={styles.filterChips}>
                {boardLabels.map(label => (
                  <button
                    key={label.id}
                    onClick={() => toggleFilterLabel(label.name)}
                    className={styles.filterChip}
                    style={filterLabels.includes(label.name) ? { backgroundColor: label.color, color: '#1E293B', borderColor: label.color } : {}}
                  >
                    {label.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {allAssignees.length > 0 && (
            <div className={styles.filterGroup}>
              <span className={styles.filterGroupLabel}>Sorumlu</span>
              <div className={styles.filterChips}>
                <button
                  onClick={() => setFilterAssignee('')}
                  className={styles.filterChip}
                  style={filterAssignee === '' ? { backgroundColor: 'var(--accent-primary)', color: '#fff', borderColor: 'var(--accent-primary)' } : {}}
                >
                  Hepsi
                </button>
                {allAssignees.map(email => (
                  <button
                    key={email}
                    onClick={() => setFilterAssignee(filterAssignee === email ? '' : email)}
                    className={styles.filterChip}
                    style={filterAssignee === email ? { backgroundColor: 'var(--accent-primary)', color: '#fff', borderColor: 'var(--accent-primary)' } : {}}
                  >
                    {email.split('@')[0]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <main className={styles.boardScrollable}>
        <div className={styles.columnsWrapper}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {boardColumns.map((col) => (
              <BoardColumn
                key={col.id}
                column={col}
                tasks={filteredTasks.filter((t) => t.columnId === col.id)}
                onEditTask={setEditingTask}
                isFiltered={hasActiveFilter}
              />
            ))}

            {!isViewer && (
              <div className={styles.addColumnContainer}>
                {!isAddingColumn ? (
                  <button
                    className={styles.addColumnBtn}
                    onClick={() => setIsAddingColumn(true)}
                  >
                    <Plus size={20} /> Yeni Sütun Ekle
                  </button>
                ) : (
                  <form onSubmit={handleAddColumn} className={styles.addColumnForm}>
                    <input
                      type="text"
                      value={newColumnTitle}
                      onChange={(e) => setNewColumnTitle(e.target.value)}
                      placeholder="Sütun başlığı..."
                      autoFocus
                    />
                    <div className={styles.formActions}>
                      <button type="submit" className={styles.saveBtn}>Kaydet</button>
                      <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={() => setIsAddingColumn(false)}
                      >
                        İptal
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            <DragOverlay>
              {activeTask ? <BoardCard task={activeTask} isOverlay /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </main>

      {editingTask && (
        <CardModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}

      {isReorderingColumns && (
        <ColumnReorderModal
          boardId={activeBoardId}
          onClose={() => setIsReorderingColumns(false)}
        />
      )}

      {isInviteModalOpen && (
        <InviteModal
          boardId={activeBoardId}
          onClose={() => setIsInviteModalOpen(false)}
        />
      )}

      {isLabelsManagerOpen && (
        <LabelsManagerModal
          boardId={activeBoardId}
          onClose={() => setIsLabelsManagerOpen(false)}
        />
      )}

      {isActivityOpen && (
        <ActivityPanel onClose={() => setIsActivityOpen(false)} />
      )}
    </div>
  );
}
