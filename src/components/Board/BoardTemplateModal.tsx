'use client';

import { useState } from 'react';
import { BOARD_TEMPLATES } from '@/lib/board-templates';
import { X } from 'lucide-react';
import styles from './Board.module.css';

interface BoardTemplateModalProps {
  onClose: () => void;
  onCreate: (title: string, templateId: string) => void;
  isPending?: boolean;
}

export default function BoardTemplateModal({ onClose, onCreate, isPending }: BoardTemplateModalProps) {
  const [title, setTitle] = useState('');
  const [selectedId, setSelectedId] = useState('blank');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate(title.trim(), selectedId);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <header className={styles.modalHeader}>
          <h2>Yeni Pano Oluştur</h2>
          <button className={styles.iconBtn} onClick={onClose}><X size={20} /></button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.inputGroup}>
              <label>Pano Adı</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Q2 Projesi"
                autoFocus
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Şablon Seç</label>
              <div className={styles.templateGrid}>
                {BOARD_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    className={`${styles.templateCard} ${selectedId === tpl.id ? styles.templateCardActive : ''}`}
                    onClick={() => setSelectedId(tpl.id)}
                  >
                    <span className={styles.templateEmoji}>{tpl.emoji}</span>
                    <span className={styles.templateName}>{tpl.name}</span>
                    <span className={styles.templateDesc}>{tpl.description}</span>
                    <span className={styles.templateMeta}>
                      {tpl.columns.length} sütun
                      {tpl.columns.some((c) => c.tasks?.length) ? ' · örnek kartlar' : ''}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <footer className={styles.modalFooter}>
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>İptal</button>
              <button type="submit" className={styles.saveBtn} disabled={isPending || !title.trim()}>
                {isPending ? 'Oluşturuluyor...' : 'Pano Oluştur'}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
