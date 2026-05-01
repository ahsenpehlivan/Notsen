import React, { useState, useMemo } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Column, Task, useBoardStore } from '@/store/useBoardStore';
import BoardCard from './BoardCard';
import { Plus, Trash2 } from 'lucide-react';
import styles from './Board.module.css';

interface BoardColumnProps {
  column: Column;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  isFiltered?: boolean;
}

export default function BoardColumn({ column, tasks, onEditTask, isFiltered }: BoardColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  const { addTask, deleteColumn, updateColumn, currentUserRole } = useBoardStore();
  const isViewer = currentUserRole === 'viewer';

  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'Column', column },
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      addTask(column.boardId, column.id, newTaskTitle.trim());
      setNewTaskTitle('');
      setIsAdding(false);
    }
  };

  const handleTitleSave = () => {
    if (titleDraft.trim() && titleDraft.trim() !== column.title) {
      updateColumn(column.id, titleDraft.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={`${styles.column} ${isOver ? styles.columnOver : ''}`}
    >
      <div className={styles.columnHeader}>
        <div className={styles.columnTitle}>
          {isEditingTitle && !isViewer ? (
            <input
              autoFocus
              className={styles.columnTitleInput}
              value={titleDraft}
              onChange={e => setTitleDraft(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={e => {
                if (e.key === 'Enter') handleTitleSave();
                if (e.key === 'Escape') setIsEditingTitle(false);
              }}
            />
          ) : (
            <h3
              onClick={() => {
                if (!isViewer) { setTitleDraft(column.title); setIsEditingTitle(true); }
              }}
              title={!isViewer ? 'Düzenlemek için tıklayın' : ''}
              style={!isViewer ? { cursor: 'text' } : {}}
            >
              {column.title}
            </h3>
          )}
          <span
            className={styles.taskCount}
            style={isFiltered ? { background: 'rgba(230,57,70,0.15)', color: 'var(--accent-primary)' } : {}}
          >
            {tasks.length}
          </span>
        </div>
        {!isViewer && (
          <button
            className={styles.columnActionBtn}
            onClick={() => {
              if (window.confirm('Bu sütunu silmek istediğinize emin misiniz?')) {
                deleteColumn(column.id);
              }
            }}
            title="Sütunu Sil"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className={styles.columnBody}>
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <BoardCard key={task.id} task={task} onEdit={() => onEditTask(task)} />
          ))}
        </SortableContext>
      </div>

      {!isViewer && (
        <div className={styles.columnFooter}>
          {!isAdding ? (
            <button className={styles.addCardBtn} onClick={() => setIsAdding(true)}>
              <Plus size={18} /> Yeni Kart Ekle
            </button>
          ) : (
            <form onSubmit={handleAddTask} className={styles.addCardForm}>
              <textarea
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Görev başlığı..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddTask(e as any);
                  }
                }}
              />
              <div className={styles.formActions}>
                <button type="submit" className={styles.saveBtn}>Ekle</button>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsAdding(false)}
                >
                  İptal
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
