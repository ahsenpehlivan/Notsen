import React, { useState } from 'react';
import { Task, useBoardStore } from '@/store/useBoardStore';
import { X, Trash2 } from 'lucide-react';
import styles from './Board.module.css';

interface CardModalProps {
  task: Task;
  onClose: () => void;
}

export default function CardModal({ task, onClose }: CardModalProps) {
  const { updateTask, deleteTask } = useBoardStore();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [tags, setTags] = useState<string[]>(task.tags || []);
  const [assignee, setAssignee] = useState(task.assignee || '');

  const AVAILABLE_TAGS = ['Bug', 'Feature', 'Tasarım', 'Acil', 'Ar-Ge'];
  const AVAILABLE_USERS = ['Ahsen', 'Ali', 'Ayşe', 'Mehmet', 'Zeynep', ''];

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const maxDate = "5000-12-31";

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (title.trim()) {
      updateTask(task.id, title.trim(), description.trim(), dueDate, tags, assignee);
      onClose();
    }
  };

  const handleDelete = () => {
    if (window.confirm('Bu kartı silmek istediğinize emin misiniz?')) {
      deleteTask(task.id);
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <header className={styles.modalHeader}>
          <h2>Kart Detayı</h2>
          <button className={styles.iconBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSave}>
          <div className={styles.modalBody}>
          <div className={styles.inputGroup}>
            <label>Başlık</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Kart başlığı..."
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Son Tarih</label>
            <input
              type="date"
              value={dueDate}
              min={today}
              max={maxDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Sorumlu Kişi</label>
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              <option value="">Atanmadı</option>
              {AVAILABLE_USERS.filter(u => u !== '').map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label>Etiketler</label>
            <div className={styles.tagsContainer}>
              {AVAILABLE_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`${styles.tagToggle} ${tags.includes(tag) ? styles.tagActive : ''}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Açıklama</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Daha detaylı bir açıklama ekleyin..."
              rows={5}
            />
          </div>
        </div>

          <footer className={styles.modalFooter}>
            <button type="button" className={styles.deleteBtn} onClick={handleDelete}>
              <Trash2 size={16} /> Sil
            </button>
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>İptal</button>
              <button type="submit" className={styles.saveBtn}>Kaydet</button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
