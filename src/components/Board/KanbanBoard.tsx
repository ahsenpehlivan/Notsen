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
import { useMobileSidebar } from '@/contexts/MobileSidebarContext';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkspace } from '@/hooks/api/useWorkspace';
import { useMembers } from '@/hooks/api/useMembers';
import { useBoardMutations, useColumnMutations, useTaskMutations } from '@/hooks/api/useBoardMutations';
import { useWorkspaceUpdater } from '@/hooks/api/useWorkspaceUpdater';
import BoardColumn from './BoardColumn';
import BoardCard from './BoardCard';
import { Plus, Settings2, UserPlus, Tag, Search, X, ChevronDown, Activity, Download } from 'lucide-react';
import { exportBoardJSON, exportBoardCSV } from '@/lib/export-board';
import { toast } from '@/lib/toast';
import styles from './Board.module.css';
import CardModal from './CardModal';
import ColumnReorderModal from './ColumnReorderModal';
import InviteModal from './InviteModal';
import LabelsManagerModal from './LabelsManagerModal';
import ActivityPanel from './ActivityPanel';
export default function KanbanBoard() {
  const { activeBoardId, setIsDragging } = useBoardStore();
  const user = useAuthStore((s) => s.user);

  const { data: workspace, isLoading } = useWorkspace(user?.id ?? null, user?.email ?? null);
  const boards = workspace?.boards ?? [];
  const columns = workspace?.columns ?? [];
  const tasks = workspace?.tasks ?? [];

  const activeBoard = boards.find((b) => b.id === activeBoardId);
  const { currentUserRole } = useMembers(activeBoardId, activeBoard);

  const { updateBoardTitle } = useBoardMutations();
  const { addColumn } = useColumnMutations();
  const { syncTaskOrder } = useTaskMutations();
  const { updateTasks, getTasks, getColumns } = useWorkspaceUpdater();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [isReorderingColumns, setIsReorderingColumns] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isLabelsManagerOpen, setIsLabelsManagerOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isEditingBoardTitle, setIsEditingBoardTitle] = useState(false);
  const [boardTitleDraft, setBoardTitleDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLabels, setFilterLabels] = useState<string[]>([]);
  const [filterAssignee, setFilterAssignee] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const isViewer = currentUserRole === 'viewer';
  const boardColumns = columns.filter((c) => c.boardId === activeBoardId);
  const boardTasks = tasks.filter((t) => t.boardId === activeBoardId);

  const filteredTasks = boardTasks.filter((task) => {
    const q = searchQuery.toLowerCase().trim();
    if (q && !task.title.toLowerCase().includes(q) && !task.description?.toLowerCase().includes(q)) return false;
    if (filterLabels.length > 0 && !filterLabels.every((l) => (task.tags || []).includes(l))) return false;
    if (filterAssignee && task.assignee !== filterAssignee) return false;
    return true;
  });

  const hasActiveFilter = searchQuery.trim() !== '' || filterLabels.length > 0 || filterAssignee !== '';
  const filteredCount = boardTasks.length - filteredTasks.length;
  const allAssignees = Array.from(new Set(boardTasks.map((t) => t.assignee).filter(Boolean))) as string[];
  const boardLabels = activeBoard?.labels || [];

  const handleDragStart = (event: DragStartEvent) => {
    if (isViewer) return;
    const task = boardTasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
      setIsDragging(true);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (active.data.current?.type !== 'Task') return;

    const activeId = active.id;
    const overId = over.id;
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (isOverTask) {
      updateTasks((allTasks) => {
        const activeTaskIndex = allTasks.findIndex((t) => t.id === activeId);
        const overTaskIndex = allTasks.findIndex((t) => t.id === overId);
        if (activeTaskIndex === -1 || overTaskIndex === -1) return allTasks;

        const dragged = allTasks[activeTaskIndex];
        const overTask = allTasks[overTaskIndex];
        const newTasks = [...allTasks];

        if (dragged.columnId !== overTask.columnId) {
          newTasks[activeTaskIndex] = { ...dragged, columnId: overTask.columnId };
        }
        return arrayMove(newTasks, activeTaskIndex, overTaskIndex);
      });
    }

    if (isOverColumn) {
      updateTasks((allTasks) => {
        const activeTaskIndex = allTasks.findIndex((t) => t.id === activeId);
        if (activeTaskIndex === -1) return allTasks;
        const newTasks = [...allTasks];
        newTasks[activeTaskIndex] = { ...newTasks[activeTaskIndex], columnId: String(overId) };
        return arrayMove(newTasks, activeTaskIndex, newTasks.length - 1);
      });
    }
  };

  const handleDragEnd = () => {
    setActiveTask(null);
    setIsDragging(false);
    if (isViewer || !activeBoardId) return;

    syncTaskOrder.mutate({
      boardId: activeBoardId,
      tasks: getTasks(),
      columns: getColumns(),
    });
  };

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (newColumnTitle.trim() && activeBoardId) {
      addColumn.mutate({ boardId: activeBoardId, title: newColumnTitle.trim() });
      setNewColumnTitle('');
      setIsAddingColumn(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.boardContainer} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid var(--glass-border)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!activeBoardId || !activeBoard) {
    return (
      <div className={styles.boardContainer} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ color: 'var(--text-muted)' }}>Lütfen yandaki menüden bir pano seçin veya yeni pano oluşturun.</h2>
      </div>
    );
  }

  return (
    <div className={styles.boardContainer}>
      <header className={styles.boardHeader}>
        <div className={styles.boardHeaderLeft}>
          {isEditingBoardTitle && !isViewer ? (
            <input
              autoFocus
              className={styles.boardTitleInput}
              value={boardTitleDraft}
              onChange={(e) => setBoardTitleDraft(e.target.value)}
              onBlur={() => {
                if (boardTitleDraft.trim() && activeBoardId) {
                  updateBoardTitle.mutate({ id: activeBoardId, title: boardTitleDraft });
                }
                setIsEditingBoardTitle(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                if (e.key === 'Escape') setIsEditingBoardTitle(false);
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
            className={styles.headerActionBtn}
            data-active={isActivityOpen}
            onClick={() => setIsActivityOpen((o) => !o)}
          >
            <Activity size={16} /> <span className={styles.hideOnMobile}>Aktivite</span>
          </button>
          <button className={`${styles.headerActionBtn} ${styles.headerActionAccent}`} onClick={() => setIsInviteModalOpen(true)}>
            <UserPlus size={16} /> <span>Paylaş</span>
          </button>
          {!isViewer && (
            <>
              <button className={styles.headerActionBtn} onClick={() => setIsLabelsManagerOpen(true)}>
                <Tag size={16} /> <span className={styles.hideOnMobile}>Etiketler</span>
              </button>
              <button className={styles.headerActionBtn} onClick={() => setIsReorderingColumns(true)}>
                <Settings2 size={16} /> <span className={styles.hideOnMobile}>Sütunlar</span>
              </button>
            </>
          )}
          <div className={styles.exportWrap}>
            <button className={styles.headerActionBtn} onClick={() => setIsExportOpen((v) => !v)}>
              <Download size={16} /> <span className={styles.hideOnMobile}>Dışa Aktar</span>
            </button>
            {isExportOpen && (
              <>
                <div className={styles.exportBackdrop} onClick={() => setIsExportOpen(false)} />
                <div className={styles.exportMenu}>
                  <button onClick={() => {
                    exportBoardJSON(activeBoard, columns, tasks);
                    toast.success('JSON dosyası indirildi.');
                    setIsExportOpen(false);
                  }}>JSON olarak indir</button>
                  <button onClick={() => {
                    exportBoardCSV(activeBoard, columns, tasks);
                    toast.success('CSV dosyası indirildi.');
                    setIsExportOpen(false);
                  }}>CSV olarak indir (Excel)</button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className={styles.searchBar}>
        <div className={styles.searchInput}>
          <Search size={15} className={styles.searchIcon} />
          <input type="text" placeholder="Görev ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className={styles.clearInputBtn}><X size={13} /></button>
          )}
        </div>
        <button
          className={`${styles.filterToggleBtn} ${isFilterOpen ? styles.filterToggleBtnActive : ''}`}
          onClick={() => setIsFilterOpen((v) => !v)}
        >
          Filtrele <ChevronDown size={14} style={{ transform: isFilterOpen ? 'rotate(180deg)' : 'rotate(0)', transition: '0.2s' }} />
          {hasActiveFilter && <span className={styles.filterDot} />}
        </button>
        {hasActiveFilter && (
          <button onClick={() => { setSearchQuery(''); setFilterLabels([]); setFilterAssignee(''); }} className={styles.clearFilterBtn}>
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
                {boardLabels.map((label) => (
                  <button
                    key={label.id}
                    onClick={() => setFilterLabels((prev) => prev.includes(label.name) ? prev.filter((l) => l !== label.name) : [...prev, label.name])}
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
                <button onClick={() => setFilterAssignee('')} className={styles.filterChip} style={filterAssignee === '' ? { backgroundColor: 'var(--accent-primary)', color: '#fff', borderColor: 'var(--accent-primary)' } : {}}>
                  Hepsi
                </button>
                {allAssignees.map((email) => (
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
                boardLabels={boardLabels}
                currentUserRole={currentUserRole}
                onEditTask={setEditingTask}
                isFiltered={hasActiveFilter}
              />
            ))}

            {!isViewer && (
              <div className={styles.addColumnContainer}>
                {!isAddingColumn ? (
                  <button className={styles.addColumnBtn} onClick={() => setIsAddingColumn(true)}>
                    <Plus size={20} /> Yeni Sütun Ekle
                  </button>
                ) : (
                  <form onSubmit={handleAddColumn} className={styles.addColumnForm}>
                    <input type="text" value={newColumnTitle} onChange={(e) => setNewColumnTitle(e.target.value)} placeholder="Sütun başlığı..." autoFocus />
                    <div className={styles.formActions}>
                      <button type="submit" className={styles.saveBtn}>Kaydet</button>
                      <button type="button" className={styles.cancelBtn} onClick={() => setIsAddingColumn(false)}>İptal</button>
                    </div>
                  </form>
                )}
              </div>
            )}

            <DragOverlay>
              {activeTask ? <BoardCard task={activeTask} boardLabels={boardLabels} isOverlay /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </main>

      {editingTask && (
        <CardModal task={editingTask} boardLabels={boardLabels} boardId={activeBoardId} currentUserRole={currentUserRole} onClose={() => setEditingTask(null)} />
      )}
      {isReorderingColumns && <ColumnReorderModal boardId={activeBoardId} columns={boardColumns} onClose={() => setIsReorderingColumns(false)} />}
      {isInviteModalOpen && <InviteModal boardId={activeBoardId} board={activeBoard} onClose={() => setIsInviteModalOpen(false)} />}
      {isLabelsManagerOpen && <LabelsManagerModal boardId={activeBoardId} board={activeBoard} onClose={() => setIsLabelsManagerOpen(false)} />}
      {isActivityOpen && <ActivityPanel boardId={activeBoardId} onClose={() => setIsActivityOpen(false)} />}
    </div>
  );
}
