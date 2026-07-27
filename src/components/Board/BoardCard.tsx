import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, BoardLabel } from '@/store/useBoardStore';
import { GripVertical, AlignLeft } from 'lucide-react';
import styles from './Board.module.css';

interface BoardCardProps {
  task: Task;
  boardLabels: BoardLabel[];
  isOverlay?: boolean;
  isViewer?: boolean;
  onEdit?: () => void;
}

export default function BoardCard({ task, boardLabels, isOverlay, isViewer = false, onEdit }: BoardCardProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: 'Task', task },
    disabled: isViewer,
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const checklist = task.checklist || [];
  const totalItems = checklist.length;
  const doneItems = checklist.filter((i) => i.done).length;
  const progressPct = totalItems === 0 ? 0 : Math.round((doneItems / totalItems) * 100);
  const allDone = totalItems > 0 && doneItems === totalItems;
  const visibleTags = (task.tags || []).slice(0, 3);
  const extraTags = (task.tags || []).length - visibleTags.length;

  if (isDragging && !isOverlay) {
    return <div ref={setNodeRef} style={style} className={`${styles.card} ${styles.cardDraggingPlaceholder}`} />;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.card} ${isOverlay ? styles.cardOverlay : ''}`}
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest(`.${styles.dragHandle}`)) onEdit?.();
      }}
    >
      {!isViewer && (
        <div {...attributes} {...listeners} className={styles.dragHandle}>
          <GripVertical size={16} />
        </div>
      )}
      <div className={styles.cardContent}>
        {visibleTags.length > 0 && (
          <div className={styles.boardTags}>
            {visibleTags.map((tag) => {
              const label = boardLabels.find((l) => l.name === tag);
              return (
                <span
                  key={tag}
                  className={styles.boardTag}
                  style={label ? { backgroundColor: label.color, color: '#1E293B' } : {}}
                >
                  {tag}
                </span>
              );
            })}
            {extraTags > 0 && <span className={styles.boardTagMore}>+{extraTags}</span>}
          </div>
        )}
        <h4>{task.title}</h4>

        {totalItems > 0 && (
          <div className={styles.cardChecklistRow}>
            <div className={styles.cardChecklistBar}>
              <div
                className={styles.cardChecklistFill}
                style={{
                  width: `${progressPct}%`,
                  background: allDone ? 'var(--success)' : 'var(--accent-primary)',
                }}
              />
            </div>
            <span className={`${styles.cardChecklistCount} ${allDone ? styles.cardChecklistDone : ''}`}>
              {doneItems}/{totalItems}
            </span>
          </div>
        )}

        <div className={styles.cardFooter}>
          <div className={styles.cardBadges}>
            {task.description && (
              <div className={styles.badge} title="Açıklama var">
                <AlignLeft size={14} />
              </div>
            )}
            {task.dueDate && (
              <div className={`${styles.badge} ${styles.dueDateBadge}`}>
                {new Date(task.dueDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
              </div>
            )}
          </div>
          {task.assignee && (
            <div className={styles.assigneeAvatar} title={`Sorumlu: ${task.assignee}`}>
              {task.assignee.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
