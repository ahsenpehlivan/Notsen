import React, { useState, useEffect } from 'react';
import { Column, useBoardStore } from '@/store/useBoardStore';
import { X, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from './Board.module.css';

interface SortableColumnRowProps {
  col: Column;
  index: number;
  total: number;
  moveUp: (index: number) => void;
  moveDown: (index: number) => void;
}

function SortableColumnRow({ col, index, total, moveUp, moveDown }: SortableColumnRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: col.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={styles.reorderItem}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div {...attributes} {...listeners} style={{ cursor: 'grab', color: 'var(--text-muted)' }}>
          <GripVertical size={16} />
        </div>
        <span>{col.title}</span>
      </div>
      <div className={styles.reorderActions}>
        <button 
          className={styles.iconBtn} 
          onClick={() => moveUp(index)}
          disabled={index === 0}
          style={{ opacity: index === 0 ? 0.3 : 1 }}
        >
          <ArrowUp size={16} />
        </button>
        <button 
          className={styles.iconBtn} 
          onClick={() => moveDown(index)}
          disabled={index === total - 1}
          style={{ opacity: index === total - 1 ? 0.3 : 1 }}
        >
          <ArrowDown size={16} />
        </button>
      </div>
    </div>
  );
}

interface ColumnReorderModalProps {
  boardId: string;
  onClose: () => void;
}

export default function ColumnReorderModal({ boardId, onClose }: ColumnReorderModalProps) {
  const { columns, reorderColumns } = useBoardStore();
  const [localColumns, setLocalColumns] = useState<Column[]>([]);

  useEffect(() => {
    setLocalColumns(columns.filter(c => c.boardId === boardId));
  }, [columns, boardId]);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...localColumns];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;
    setLocalColumns(newOrder);
  };

  const moveDown = (index: number) => {
    if (index === localColumns.length - 1) return;
    const newOrder = [...localColumns];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;
    setLocalColumns(newOrder);
  };

  const handleSave = () => {
    reorderColumns(boardId, localColumns);
    onClose();
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLocalColumns((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <header className={styles.modalHeader}>
          <h2>Sütunları Düzenle</h2>
          <button className={styles.iconBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className={styles.modalBody}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Sütunların sırasını değiştirmek için okları kullanın veya sürükleyip bırakın.
          </p>
          <div className={styles.reorderList}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={localColumns.map(c => c.id)} strategy={verticalListSortingStrategy}>
                {localColumns.map((col, index) => (
                  <SortableColumnRow 
                    key={col.id} 
                    col={col} 
                    index={index} 
                    total={localColumns.length} 
                    moveUp={moveUp} 
                    moveDown={moveDown} 
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>

        <footer className={styles.modalFooter} style={{ justifyContent: 'flex-end' }}>
          <div className={styles.modalActions}>
            <button className={styles.cancelBtn} onClick={onClose}>İptal</button>
            <button className={styles.saveBtn} onClick={handleSave}>Kaydet</button>
          </div>
        </footer>
      </div>
    </div>
  );
}
