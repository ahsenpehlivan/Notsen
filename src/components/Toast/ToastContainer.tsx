'use client';

import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useToastStore } from '@/store/useToastStore';
import styles from './Toast.module.css';

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const;

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container} aria-live="polite">
      {toasts.map((t) => {
        const Icon = ICONS[t.type];
        return (
          <div key={t.id} className={`${styles.toast} ${styles[t.type]}`} role="alert">
            <Icon size={18} className={styles.icon} />
            <span className={styles.message}>{t.message}</span>
            <button
              className={styles.closeBtn}
              onClick={() => removeToast(t.id)}
              aria-label="Kapat"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
