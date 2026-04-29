import React, { useState } from 'react';
import { useBoardStore } from '@/store/useBoardStore';
import { X, UserPlus } from 'lucide-react';
import styles from './Board.module.css';

interface InviteModalProps {
  boardId: string;
  onClose: () => void;
}

export default function InviteModal({ boardId, onClose }: InviteModalProps) {
  const { inviteToBoard } = useBoardStore();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setMessage({ type: 'error', text: 'Geçerli bir e-posta adresi giriniz.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);
    const { success, error } = await inviteToBoard(boardId, email.trim());
    setIsLoading(false);

    if (success) {
      setMessage({ type: 'success', text: 'Kullanıcı panoya başarıyla eklendi!' });
      setEmail('');
    } else {
      setMessage({ type: 'error', text: error || 'Davet gönderilemedi.' });
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Panoyu Paylaş</h2>
          <button className={styles.iconBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <div className={styles.modalBody}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Bu panoyu e-posta adresiyle başka bir kullanıcıyla paylaşabilirsiniz. Davet ettiğiniz kullanıcı panoyu görebilir ve düzenleyebilir.
          </p>
          <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            <div className={styles.inputGroup}>
              <label>Kullanıcı E-posta</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="ornek@mail.com"
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--glass-border-subtle)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>
            
            {message && (
              <div style={{
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                backgroundColor: message.type === 'error' ? 'var(--danger-subtle)' : 'var(--success-subtle)',
                color: message.type === 'error' ? 'var(--danger-hover)' : '#56d364',
                border: `1px solid ${message.type === 'error' ? 'rgba(248, 81, 73, 0.2)' : 'rgba(86, 211, 100, 0.2)'}`
              }}>
                {message.text}
              </div>
            )}

            <button 
              type="submit" 
              className={styles.saveBtn} 
              disabled={isLoading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem', fontSize: '0.9rem', opacity: isLoading ? 0.7 : 1 }}
            >
              <UserPlus size={16} />
              {isLoading ? 'Davet Ediliyor...' : 'Panoya Ekle'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
