'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, X, Clock, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkspace } from '@/hooks/api/useWorkspace';
import {
  getDueNotifications,
  getDismissedIds,
  dismissNotification,
  clearDismissedIfNewDay,
  shouldShowBrowserNotification,
  markBrowserNotified,
  requestNotificationPermission,
  showBrowserNotification,
} from '@/lib/due-notifications';
import styles from './NotificationBell.module.css';

export default function NotificationBell() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: workspace } = useWorkspace(user?.id ?? null, user?.email ?? null);
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(() => getDismissedIds());

  const allNotifications = useMemo(() => getDueNotifications(workspace), [workspace]);
  const visible = useMemo(
    () => allNotifications.filter((n) => !dismissed.has(n.id)),
    [allNotifications, dismissed]
  );

  useEffect(() => {
    clearDismissedIfNewDay();
    setDismissed(getDismissedIds());
  }, []);

  useEffect(() => {
    if (!workspace || visible.length === 0) return;
    if (!shouldShowBrowserNotification()) return;

    requestNotificationPermission().then((granted) => {
      if (!granted) return;
      const urgent = visible.filter((n) => n.type === 'overdue' || n.type === 'today');
      if (urgent.length === 0) return;
      const title = urgent.length === 1
        ? `Notsen: ${urgent[0].taskTitle}`
        : `Notsen: ${urgent.length} görev dikkat gerektiriyor`;
      const body = urgent.slice(0, 3).map((n) => `• ${n.taskTitle} (${n.message})`).join('\n');
      showBrowserNotification(title, body);
      markBrowserNotified();
    });
  }, [workspace, visible]);

  if (!user) return null;

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dismissNotification(id);
    setDismissed(getDismissedIds());
  };

  const iconFor = (type: string) => {
    if (type === 'overdue') return <AlertTriangle size={14} />;
    return <Clock size={14} />;
  };

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.bellBtn}
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Bildirimler"
      >
        <Bell size={18} />
        {visible.length > 0 && (
          <span className={styles.badge}>{visible.length > 9 ? '9+' : visible.length}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setIsOpen(false)} />
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3>Son Tarih Bildirimleri</h3>
              <button onClick={() => setIsOpen(false)} className={styles.closeBtn}><X size={16} /></button>
            </div>
            {visible.length === 0 ? (
              <p className={styles.empty}>Yaklaşan veya geciken görev yok.</p>
            ) : (
              <ul className={styles.list}>
                {visible.map((n) => (
                  <li key={n.id}>
                    <div
                      className={`${styles.item} ${styles[`type_${n.type}`]}`}
                      onClick={() => {
                        setIsOpen(false);
                        router.push(`/boards/${n.boardId}`);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setIsOpen(false);
                          router.push(`/boards/${n.boardId}`);
                        }
                      }}
                    >
                      <span className={styles.itemIcon}>{iconFor(n.type)}</span>
                      <span className={styles.itemBody}>
                        <strong>{n.taskTitle}</strong>
                        <span>{n.boardTitle} · {n.message}</span>
                      </span>
                      <button
                        className={styles.dismissBtn}
                        onClick={(e) => handleDismiss(n.id, e)}
                        aria-label="Kapat"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
