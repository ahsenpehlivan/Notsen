import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/store/useBoardStore';
import { GripVertical, AlignLeft } from 'lucide-react';
import styles from './Board.module.css';

interface BoardCardProps {
  task: Task;
  isOverlay?: boolean;
  onEdit?: () => void;
}

export default function BoardCard({ task, isOverlay, onEdit }: BoardCardProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`${styles.card} ${styles.cardDraggingPlaceholder}`}
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.card} ${isOverlay ? styles.cardOverlay : ''}`}
      onClick={(e) => {
        // Drag handle dışına tıklandığında modal açılsın
        if (!(e.target as HTMLElement).closest(`.${styles.dragHandle}`)) {
          onEdit?.();
        }
      }}
    >
      <div
        {...attributes}
        {...listeners}
        className={styles.dragHandle}
      >
        <GripVertical size={16} />
      </div>
      <div className={styles.cardContent}>
        {task.tags && task.tags.length > 0 && (
          <div className={styles.boardTags}>
            {task.tags.map(tag => (
              <span key={tag} className={`${styles.boardTag} ${styles['tag' + tag.replace(/[^a-zA-Z]/g, '')]}`}>
                {tag}
              </span>
            ))}
          </div>
        )}
        <h4>{task.title}</h4>
        
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
