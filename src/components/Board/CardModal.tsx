import React, { useState } from 'react';
import { Task, useBoardStore } from '@/store/useBoardStore';
import { useAuthStore } from '@/store/useAuthStore';
import { X, Trash2 } from 'lucide-react';
import styles from './Board.module.css';

interface CardModalProps {
  task: Task;
  onClose: () => void;
}

export default function CardModal({ task, onClose }: CardModalProps) {
  const { updateTask, deleteTask, members, currentUserRole } = useBoardStore();
  const { user } = useAuthStore();
  
  const isViewer = currentUserRole === 'viewer';
  
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [tags, setTags] = useState<string[]>(task.tags || []);
  const [assignee, setAssignee] = useState(task.assignee || '');

  const AVAILABLE_TAGS = ['Bug', 'Feature', 'Tasarım', 'Acil', 'Ar-Ge'];
  
  // Sorumlu atanabilecek kişiler: Pano üyeleri + Kullanıcının kendisi
  const allUserEmails = new Set(members.map(m => m.user_email));
  if (user?.email) allUserEmails.add(user.email);
  const AVAILABLE_USERS = Array.from(allUserEmails);

  const toggleTag = (tag: string) => {
    if (isViewer) return;
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
    if (isViewer) return;
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
              disabled={isViewer}
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
              disabled={isViewer}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Sorumlu Kişi</label>
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)} disabled={isViewer}>
              <option value="">Atanmadı</option>
              {AVAILABLE_USERS.map(u => (
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
                  disabled={isViewer}
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
              disabled={isViewer}
            />
          </div>
        </div>

          <footer className={styles.modalFooter}>
            {!isViewer && (
              <button type="button" className={styles.deleteBtn} onClick={handleDelete}>
                <Trash2 size={16} /> Sil
              </button>
            )}
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>İptal</button>
              {!isViewer && <button type="submit" className={styles.saveBtn}>Kaydet</button>}
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
