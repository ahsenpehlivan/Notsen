'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { THEMES, useBoardStore } from '@/store/useBoardStore';
import { useWorkspace } from '@/hooks/api/useWorkspace';
import { getWorkspaceStats } from '@/lib/workspace-stats';
import { clearLastBoardId } from '@/lib/preferences';
import { toast } from '@/lib/toast';
import { User, Shield, BarChart3, Calendar, Mail, AlertTriangle, CheckSquare, Clock, Palette } from 'lucide-react';
import styles from './Profile.module.css';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, linkGoogle, linkGitHub, deleteAccount, isLoading } = useAuthStore();
  const { theme, setTheme } = useBoardStore();
  const { data: workspace, isLoading: workspaceLoading } = useWorkspace(user?.id ?? null, user?.email ?? null);

  const stats = useMemo(
    () => getWorkspaceStats(workspace, user?.id, user?.email),
    [workspace, user?.id, user?.email]
  );

  if (!user) return null;

  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Bilinmiyor';

  const lastSignIn = user.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Bilinmiyor';

  const provider = user.app_metadata?.provider ?? 'email';
  const providerLabel = provider === 'google' ? 'Google' : provider === 'github' ? 'GitHub' : 'E-posta';

  const initials = user.email?.charAt(0).toUpperCase() ?? '?';
  const identities = user.identities || [];
  const hasGoogle = identities.some((i) => i.provider === 'google');
  const hasGitHub = identities.some((i) => i.provider === 'github');

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Hesabınızı ve tüm panolarınızı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.'
    );
    if (!confirmed) return;

    const result = await deleteAccount();
    if (result.success) {
      clearLastBoardId(user.id);
      toast.success(result.message || 'Hesabınız silindi.');
      router.push('/login');
    } else {
      toast.error(result.error || 'Hesap silinemedi.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h1>Profilim</h1>
        </div>
        <p>Hesap bilgilerinizi, görünüm temalarınızı ve istatistiklerinizi buradan yönetebilirsiniz.</p>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}><User size={18} /></div>
            <h2>Hesap Bilgileri</h2>
          </div>
          <div className={styles.avatarSection}>
            <div className={styles.avatar}>{initials}</div>
            <div>
              <div className={styles.avatarName}>{user.email?.split('@')[0]}</div>
              <div className={styles.avatarEmail}>{user.email}</div>
            </div>
            <span className={styles.badge}>✓ Aktif Hesap</span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}><Shield size={18} /></div>
            <h2>Hesap Detayları</h2>
          </div>
          <div className={styles.infoList}>
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}><Mail size={12} style={{ display: 'inline', marginRight: 4 }} />E-posta</div>
              <div className={styles.infoValue}>{user.email}</div>
            </div>
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}><Shield size={12} style={{ display: 'inline', marginRight: 4 }} />Giriş Yöntemi</div>
              <div className={styles.infoValue}>{providerLabel}</div>
            </div>
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}><Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />Kayıt Tarihi</div>
              <div className={styles.infoValue}>{createdAt}</div>
            </div>
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}><Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />Son Giriş</div>
              <div className={styles.infoValue}>{lastSignIn}</div>
            </div>
          </div>
        </div>

        <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}><Palette size={18} /></div>
            <h2>Görünüm & Temalar ({THEMES.length} Tema)</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '0.6rem' }}>
            {THEMES.map((t) => {
              const isActive = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: isActive ? 'var(--accent-subtle)' : 'var(--bg-tertiary)',
                    border: isActive ? '1.5px solid var(--accent-primary)' : '1px solid var(--glass-border-subtle)',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: t.swatch,
                      border: '1.5px solid rgba(255,255,255,0.2)',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}><BarChart3 size={18} /></div>
            <h2>İstatistikler</h2>
          </div>
          {workspaceLoading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Yükleniyor...</p>
          ) : (
            <>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <div className={styles.statNumber}>{stats.totalBoards}</div>
                  <div className={styles.statLabel}>Pano</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statNumber}>{stats.totalTasks}</div>
                  <div className={styles.statLabel}>Görev</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statNumber}>{stats.assignedToMe}</div>
                  <div className={styles.statLabel}>Bana Atanan</div>
                </div>
              </div>
              <div className={styles.statsExtra}>
                <span><strong>{stats.ownedBoards}</strong> sahip olunan · <strong>{stats.sharedBoards}</strong> paylaşılan pano</span>
                <span><Clock size={12} /> <strong>{stats.dueThisWeek}</strong> bu hafta bitiyor</span>
                {stats.overdue > 0 && (
                  <span className={styles.statWarning}><AlertTriangle size={12} /> <strong>{stats.overdue}</strong> geciken görev</span>
                )}
              </div>
            </>
          )}
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}><CheckSquare size={18} /></div>
            <h2>Hızlı Erişim</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button className={styles.secondaryBtn} onClick={() => router.push('/tasks')}>
              Görevlerim ({stats.assignedToMe})
            </button>
            <button className={styles.secondaryBtn} onClick={() => router.push('/calendar')}>
              Takvim Görünümü
            </button>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}><Shield size={18} /></div>
            <h2>Hesap Bağlama</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              Mevcut e-posta hesabınıza sosyal hesaplarınızı bağlayarak alternatif giriş yöntemleri ekleyebilirsiniz.
            </p>
            {hasGoogle ? (
              <button className={styles.secondaryBtn} disabled style={{ opacity: 0.6, cursor: 'default' }}>✓ Google Hesabı Bağlı</button>
            ) : (
              <button className={styles.secondaryBtn} onClick={linkGoogle}>Google Hesabını Bağla</button>
            )}
            {hasGitHub ? (
              <button className={styles.secondaryBtn} disabled style={{ opacity: 0.6, cursor: 'default' }}>✓ GitHub Hesabı Bağlı</button>
            ) : (
              <button className={styles.secondaryBtn} onClick={linkGitHub}>GitHub Hesabını Bağla</button>
            )}
          </div>
        </div>

        <div className={`${styles.card} ${styles.dangerCard}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon} style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>
              <AlertTriangle size={18} />
            </div>
            <h2>Hesap Yönetimi</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button className={styles.secondaryBtn} onClick={logout}>Çıkış Yap</button>
            <button className={styles.dangerBtn} onClick={handleDeleteAccount} disabled={isLoading}>
              {isLoading ? 'Siliniyor...' : 'Hesabı Kalıcı Olarak Sil'}
            </button>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Tüm panolarınız, görevleriniz ve paylaşım üyelikleriniz silinir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
