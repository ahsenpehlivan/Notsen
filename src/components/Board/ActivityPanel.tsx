import React, { useEffect, useCallback } from 'react';
import { ActivityLog, useBoardStore } from '@/store/useBoardStore';
import { X, GitBranch, Plus, Pencil, Trash2, ArrowRight, Users, Tag } from 'lucide-react';
import styles from './ActivityPanel.module.css';

interface ActivityPanelProps {
  onClose: () => void;
}

function relativeTime(isoDate: string): string {
  const now = Date.now();
  const diff = now - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Az önce';
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün önce`;
  return new Date(isoDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

function getActionIcon(action: string) {
  if (action === 'task_created')   return <Plus  size={14} />;
  if (action === 'task_deleted')   return <Trash2 size={14} />;
  if (action === 'task_moved')     return <ArrowRight size={14} />;
  if (action === 'task_updated')   return <Pencil size={14} />;
  if (action === 'column_created') return <Plus size={14} />;
  if (action === 'column_deleted') return <Trash2 size={14} />;
  if (action === 'column_renamed') return <Pencil size={14} />;
  if (action === 'board_renamed')  return <Pencil size={14} />;
  if (action === 'member_invited') return <Users size={14} />;
  if (action === 'label_created')  return <Tag size={14} />;
  return <GitBranch size={14} />;
}

function getActionColor(action: string): string {
  if (action.endsWith('_deleted')) return 'danger';
  if (action.endsWith('_created')) return 'success';
  if (action === 'task_moved')     return 'accent';
  if (action === 'member_invited') return 'info';
  return 'muted';
}

function formatMessage(log: ActivityLog): React.ReactNode {
  const name = log.userEmail.split('@')[0];
  const title = log.entityTitle ? <strong>"{log.entityTitle}"</strong> : null;
  const meta = log.metadata || {};

  switch (log.action) {
    case 'task_created':
      return <>{name} {title} kartını oluşturdu</>;
    case 'task_deleted':
      return <>{name} {title} kartını sildi</>;
    case 'task_updated':
      return <>{name} {title} kartını düzenledi</>;
    case 'task_moved':
      return <>{name} {title} kartını <strong>{meta.from_column}</strong> → <strong>{meta.to_column}</strong> sütununa taşıdı</>;
    case 'column_created':
      return <>{name} <strong>{meta.new_title || log.entityTitle}</strong> sütunu oluşturdu</>;
    case 'column_deleted':
      return <>{name} {title} sütununu sildi</>;
    case 'column_renamed':
      return <>{name} <strong>{meta.old_title}</strong> sütununu <strong>{meta.new_title}</strong> olarak yeniden adlandırdı</>;
    case 'board_renamed':
      return <>{name} panoyu <strong>{meta.new_title}</strong> olarak yeniden adlandırdı</>;
    case 'member_invited':
      return <>{name} <strong>{log.entityTitle}</strong>'i {meta.role === 'editor' ? 'editör' : 'görüntüleyici'} olarak davet etti</>;
    default:
      return <>{name} bir işlem yaptı</>;
  }
}

export default function ActivityPanel({ onClose }: ActivityPanelProps) {
  const { activityLogs, fetchActivityLogs, activeBoardId } = useBoardStore();

  const load = useCallback(() => {
    if (activeBoardId) fetchActivityLogs(activeBoardId);
  }, [activeBoardId, fetchActivityLogs]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <GitBranch size={16} />
          <span>Aktivite Geçmişi</span>
        </div>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className={styles.body}>
        {activityLogs.length === 0 ? (
          <div className={styles.empty}>
            <GitBranch size={32} className={styles.emptyIcon} />
            <p>Henüz aktivite yok</p>
            <span>Kart ekle, taşı veya düzenle — burada görünecek.</span>
          </div>
        ) : (
          <ul className={styles.list}>
            {activityLogs.map((log, i) => (
              <li key={log.id} className={styles.item}>
                <div className={`${styles.iconWrap} ${styles[getActionColor(log.action)]}`}>
                  {getActionIcon(log.action)}
                </div>
                <div className={styles.itemContent}>
                  <div className={styles.avatar} title={log.userEmail}>
                    {log.userEmail.charAt(0).toUpperCase()}
                  </div>
                  <p className={styles.message}>{formatMessage(log)}</p>
                  <time className={styles.time} title={new Date(log.createdAt).toLocaleString('tr-TR')}>
                    {relativeTime(log.createdAt)}
                  </time>
                </div>
                {i < activityLogs.length - 1 && <div className={styles.connector} />}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.footer}>
        <button className={styles.refreshBtn} onClick={load}>Yenile</button>
        <span className={styles.footerNote}>Son 100 aktivite gösteriliyor</span>
      </div>
    </div>
  );
}
