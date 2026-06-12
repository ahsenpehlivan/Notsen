import React, { useState } from 'react';
import { Board } from '@/store/useBoardStore';
import { useMembers } from '@/hooks/api/useMembers';
import { useMemberMutations } from '@/hooks/api/useBoardMutations';
import { X, UserPlus, ShieldAlert, Trash2 } from 'lucide-react';
import styles from './Board.module.css';

interface InviteModalProps {
  boardId: string;
  board: Board;
  onClose: () => void;
}

export default function InviteModal({ boardId, board, onClose }: InviteModalProps) {
  const { members, currentUserRole } = useMembers(boardId, board);
  const { inviteToBoard, updateMemberRole, removeMember } = useMemberMutations();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setMessage({ type: 'error', text: 'Geçerli bir e-posta adresi giriniz.' });
      return;
    }

    setMessage(null);
    inviteToBoard.mutate(
      { boardId, email: email.trim(), role },
      {
        onSuccess: () => {
          setMessage({ type: 'success', text: 'Kullanıcı panoya başarıyla eklendi!' });
          setEmail('');
        },
        onError: (err: Error) => {
          setMessage({ type: 'error', text: err.message || 'Davet gönderilemedi.' });
        },
      }
    );
  };

  const isOwner = currentUserRole === 'owner';

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className={styles.modalHeader}>
          <h2>Panoyu Paylaş ve Üyeler</h2>
          <button className={styles.iconBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <div className={styles.modalBody}>
          {isOwner ? (
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Kullanıcıları e-posta adresleriyle davet edin ve yetkilerini belirleyin.
              </p>
              <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@mail.com"
                    style={{
                      flex: 1,
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--glass-border-subtle)',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'viewer' | 'editor')}
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--glass-border-subtle)',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="viewer">Görüntüleyici</option>
                    <option value="editor">Düzenleyici</option>
                  </select>
                </div>

                {message && (
                  <div style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    backgroundColor: message.type === 'error' ? 'var(--danger-subtle)' : 'var(--success-subtle)',
                    color: message.type === 'error' ? 'var(--danger-hover)' : '#56d364',
                  }}>
                    {message.text}
                  </div>
                )}

                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={inviteToBoard.isPending}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem', fontSize: '0.9rem', opacity: inviteToBoard.isPending ? 0.7 : 1 }}
                >
                  <UserPlus size={16} />
                  {inviteToBoard.isPending ? 'Davet Ediliyor...' : 'Panoya Ekle'}
                </button>
              </form>
            </div>
          ) : (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <ShieldAlert size={20} color="var(--accent-primary)" />
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Sadece pano sahibi yeni üyeler davet edebilir. Rolünüz: <strong>{currentUserRole === 'editor' ? 'Düzenleyici' : 'Görüntüleyici'}</strong>
              </p>
            </div>
          )}

          <div>
            <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--glass-border-subtle)', paddingBottom: '0.5rem' }}>
              Mevcut Üyeler ({members.length + 1})
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--glass-border-subtle)' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Pano Sahibi</span>
                <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'var(--accent-subtle)', color: 'var(--accent-hover)', borderRadius: '4px', fontWeight: 600 }}>Sahip</span>
              </li>
              {members.map((member) => (
                <li key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--glass-border-subtle)' }}>
                  <span style={{ fontSize: '0.9rem' }}>{member.user_email}</span>
                  {isOwner ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <select
                        value={member.role}
                        onChange={(e) => updateMemberRole.mutate({ memberId: member.id, boardId, role: e.target.value as 'viewer' | 'editor' })}
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          border: '1px solid var(--glass-border-subtle)',
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                        }}
                      >
                        <option value="viewer">Görüntüleyici</option>
                        <option value="editor">Düzenleyici</option>
                      </select>
                      <button
                        onClick={() => {
                          if (window.confirm(`${member.user_email} panodan çıkarılacak. Emin misiniz?`)) {
                            removeMember.mutate({ memberId: member.id, boardId });
                          }
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--danger-hover)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                        title="Üyeyi Çıkar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', borderRadius: '4px' }}>
                      {member.role === 'editor' ? 'Düzenleyici' : 'Görüntüleyici'}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
