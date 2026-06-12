import React, { useState } from 'react';
import { Task, ChecklistItem, BoardLabel, TaskComment } from '@/store/useBoardStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useMembers } from '@/hooks/api/useMembers';
import { useTaskMutations } from '@/hooks/api/useBoardMutations';
import { X, Trash2, Plus, CheckSquare, MessageSquare } from 'lucide-react';
import styles from './Board.module.css';

interface CardModalProps {
  task: Task;
  boardId: string;
  boardLabels: BoardLabel[];
  currentUserRole: 'viewer' | 'editor' | 'owner' | null;
  onClose: () => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function CardModal({ task, boardId, boardLabels, currentUserRole, onClose }: CardModalProps) {
  const { user } = useAuthStore();
  const { members } = useMembers(boardId);
  const { updateTask, deleteTask } = useTaskMutations();

  const isViewer = currentUserRole === 'viewer';

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [tags, setTags] = useState<string[]>(task.tags || []);
  const [assignee, setAssignee] = useState(task.assignee || '');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(task.checklist || []);
  const [comments, setComments] = useState<TaskComment[]>(task.comments || []);
  const [newItemText, setNewItemText] = useState('');
  const [newCommentText, setNewCommentText] = useState('');

  const AVAILABLE_TAGS = boardLabels;

  const allUserEmails = new Set(members.map(m => m.user_email));
  if (user?.email) allUserEmails.add(user.email);
  const AVAILABLE_USERS = Array.from(allUserEmails);

  // --- Checklist helpers ---
  const doneCount = checklist.filter(i => i.done).length;
  const totalCount = checklist.length;
  const progressPct = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  const toggleItem = (id: string) => {
    if (isViewer) return;
    setChecklist(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));
  };

  const addItem = () => {
    if (!newItemText.trim() || isViewer) return;
    setChecklist(prev => [...prev, { id: generateId(), text: newItemText.trim(), done: false }]);
    setNewItemText('');
  };

  const removeItem = (id: string) => {
    if (isViewer) return;
    setChecklist(prev => prev.filter(i => i.id !== id));
  };

  const updateItemText = (id: string, text: string) => {
    setChecklist(prev => prev.map(i => i.id === id ? { ...i, text } : i));
  };

  // --- Tag toggle ---
  const toggleTag = (tag: string) => {
    if (isViewer) return;
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const addComment = () => {
    if (!newCommentText.trim() || isViewer || !user?.email) return;
    const newComment: TaskComment = {
      id: generateId(),
      userEmail: user.email,
      text: newCommentText.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...comments, newComment];
    setComments(updated);
    setNewCommentText('');
    updateTask.mutate({
      id: task.id,
      boardId,
      title: title.trim(),
      description: description.trim(),
      dueDate,
      tags,
      assignee,
      checklist,
      comments: updated,
    });
  };

  const today = new Date().toISOString().split('T')[0];

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isViewer) return;
    if (title.trim()) {
      updateTask.mutate({
        id: task.id,
        boardId,
        title: title.trim(),
        description: description.trim(),
        dueDate,
        tags,
        assignee,
        checklist,
        comments,
      });
      onClose();
    }
  };

  const handleDelete = () => {
    if (window.confirm('Bu kartı silmek istediğinize emin misiniz?')) {
      deleteTask.mutate({ id: task.id, boardId });
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <header className={styles.modalHeader}>
          <h2>Kart Detayı</h2>
          <button className={styles.iconBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSave}>
          <div className={styles.modalBody}>

            {/* Başlık */}
            <div className={styles.inputGroup}>
              <label>Başlık</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Kart başlığı..."
                disabled={isViewer}
              />
            </div>

            {/* Son Tarih */}
            <div className={styles.inputGroup}>
              <label>Son Tarih</label>
              <input
                type="date"
                value={dueDate}
                min={today}
                max="5000-12-31"
                onChange={e => setDueDate(e.target.value)}
                disabled={isViewer}
              />
            </div>

            {/* Sorumlu */}
            <div className={styles.inputGroup}>
              <label>Sorumlu Kişi</label>
              <select value={assignee} onChange={e => setAssignee(e.target.value)} disabled={isViewer}>
                <option value="">Atanmadı</option>
                {AVAILABLE_USERS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            {/* Etiketler */}
            <div className={styles.inputGroup}>
              <label>Etiketler</label>
              <div className={styles.tagsContainer}>
                {AVAILABLE_TAGS.map(label => {
                  const isActive = tags.includes(label.name);
                  return (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => toggleTag(label.name)}
                      className={`${styles.tagToggle} ${isActive ? styles.tagActive : ''}`}
                      disabled={isViewer}
                      style={{
                        backgroundColor: isActive ? label.color : 'transparent',
                        color: isActive ? '#1E293B' : 'var(--text-secondary)',
                        borderColor: isActive ? label.color : 'transparent',
                      }}
                    >
                      {label.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ─── Checklist ─── */}
            <div className={styles.inputGroup}>
              <div className={styles.checklistHeader}>
                <label>
                  <CheckSquare size={14} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />
                  Alt Görevler
                </label>
                {totalCount > 0 && (
                  <span className={styles.checklistBadge}>{doneCount}/{totalCount}</span>
                )}
              </div>

              {/* Progress Bar */}
              {totalCount > 0 && (
                <div className={styles.checklistProgress}>
                  <div className={styles.checklistProgressBar}>
                    <div
                      className={styles.checklistProgressFill}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span className={styles.checklistProgressPct}>{progressPct}%</span>
                </div>
              )}

              {/* Items */}
              <div className={styles.checklistItems}>
                {checklist.map(item => (
                  <div key={item.id} className={styles.checklistItem}>
                    <button
                      type="button"
                      className={`${styles.checklistCheckbox} ${item.done ? styles.checklistCheckboxDone : ''}`}
                      onClick={() => toggleItem(item.id)}
                      disabled={isViewer}
                    />
                    <input
                      className={`${styles.checklistItemText} ${item.done ? styles.checklistItemDone : ''}`}
                      value={item.text}
                      onChange={e => updateItemText(item.id, e.target.value)}
                      disabled={isViewer}
                    />
                    {!isViewer && (
                      <button
                        type="button"
                        className={styles.checklistDeleteBtn}
                        onClick={() => removeItem(item.id)}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add item */}
              {!isViewer && (
                <div className={styles.checklistAddRow}>
                  <input
                    className={styles.checklistAddInput}
                    value={newItemText}
                    onChange={e => setNewItemText(e.target.value)}
                    placeholder="Alt görev ekle..."
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
                  />
                  <button
                    type="button"
                    className={styles.checklistAddBtn}
                    onClick={addItem}
                    disabled={!newItemText.trim()}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Açıklama */}
            <div className={styles.inputGroup}>
              <label>Açıklama</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Daha detaylı bir açıklama ekleyin..."
                rows={4}
                disabled={isViewer}
              />
            </div>

            {/* Yorumlar */}
            <div className={styles.inputGroup}>
              <div className={styles.checklistHeader}>
                <label>
                  <MessageSquare size={14} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />
                  Yorumlar {comments.length > 0 && `(${comments.length})`}
                </label>
              </div>
              <div className={styles.commentsList}>
                {comments.length === 0 && (
                  <p className={styles.commentsEmpty}>Henüz yorum yok.</p>
                )}
                {comments.map((c) => (
                  <div key={c.id} className={styles.commentItem}>
                    <div className={styles.commentMeta}>
                      <span className={styles.commentAuthor}>{c.userEmail.split('@')[0]}</span>
                      <time className={styles.commentTime}>
                        {new Date(c.createdAt).toLocaleString('tr-TR', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </time>
                    </div>
                    <p className={styles.commentText}>{c.text}</p>
                  </div>
                ))}
              </div>
              {!isViewer && (
                <div className={styles.checklistAddRow}>
                  <input
                    className={styles.checklistAddInput}
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Yorum yaz..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        addComment();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className={styles.checklistAddBtn}
                    onClick={addComment}
                    disabled={!newCommentText.trim()}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              )}
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
