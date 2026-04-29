import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
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
import { Plus, Settings2 } from 'lucide-react';
import styles from './Board.module.css';
import CardModal from './CardModal';
import ColumnReorderModal from './ColumnReorderModal';
import InviteModal from './InviteModal';
import { UserPlus } from 'lucide-react';

export default function KanbanBoard() {
  const { activeBoardId, boards, columns, tasks, setColumns, setTasks, addColumn } = useBoardStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [isReorderingColumns, setIsReorderingColumns] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px hareket etmeden sürükleme başlamaz, tıklamaları engellememek için
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const boardColumns = columns.filter((c) => c.boardId === activeBoardId);
  const boardTasks = tasks.filter((t) => t.boardId === activeBoardId);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = boardTasks.find((t) => t.id === active.id);
    if (task) setActiveTask(task);
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
      const activeIndex = tasks.findIndex((t) => t.id === activeId);
      const overIndex = tasks.findIndex((t) => t.id === overId);

      if (tasks[activeIndex].columnId !== tasks[overIndex].columnId) {
        setTasks(
          tasks.map((t, idx) => {
            if (idx === activeIndex) {
              return { ...t, columnId: tasks[overIndex].columnId };
            }
            return t;
          })
        );
        // Aynı tick içinde arrayMove çağırırsak state conflict olabilir, useEffect ile çözülür veya map içinde halledilir.
        // Ama basitçe, arrayMove ile sırayı da güncelleyelim.
        // Dnd-kit react state güncellemelerinde biraz asenktron olabilir, o yüzden fonksiyonel state update daha güvenlidir.
        // Zustand store ile senkron tutmak için:
        useBoardStore.setState((state) => {
           const activeTaskIndex = state.tasks.findIndex(t => t.id === activeId);
           const overTaskIndex = state.tasks.findIndex(t => t.id === overId);
           const newTasks = [...state.tasks];
           newTasks[activeTaskIndex].columnId = newTasks[overTaskIndex].columnId;
           return { tasks: arrayMove(newTasks, activeTaskIndex, overTaskIndex) };
        });
      } else {
        // Aynı sütun içinde sıralama
        useBoardStore.setState((state) => {
          const activeTaskIndex = state.tasks.findIndex(t => t.id === activeId);
          const overTaskIndex = state.tasks.findIndex(t => t.id === overId);
          return { tasks: arrayMove(state.tasks, activeTaskIndex, overTaskIndex) };
        });
      }
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
  };

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (newColumnTitle.trim() && activeBoardId) {
      addColumn(activeBoardId, newColumnTitle.trim());
      setNewColumnTitle('');
      setIsAddingColumn(false);
    }
  };

  const activeBoard = boards.find(b => b.id === activeBoardId);

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
        <h2>{activeBoard.title}</h2>
        <div className={styles.headerActions}>
          <button 
            className={styles.addCardBtn} 
            style={{ width: 'auto', padding: '0.5rem 1rem', background: 'var(--accent-subtle)', color: 'var(--accent-hover)' }}
            onClick={() => setIsInviteModalOpen(true)}
          >
            <UserPlus size={16} /> Paylaş
          </button>
          <button 
            className={styles.addCardBtn} 
            style={{ width: 'auto', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)' }}
            onClick={() => setIsReorderingColumns(true)}
          >
            <Settings2 size={16} /> Sütunları Düzenle
          </button>
        </div>
      </header>

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
                tasks={boardTasks.filter((t) => t.columnId === col.id)}
                onEditTask={setEditingTask}
              />
            ))}

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
    </div>
  );
}
