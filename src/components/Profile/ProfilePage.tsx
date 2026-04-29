'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useBoardStore } from '@/store/useBoardStore';
import { User, Shield, BarChart3, Calendar, Mail, AlertTriangle } from 'lucide-react';
import styles from './Profile.module.css';

export default function ProfilePage() {
  const { user, logout, linkGoogle, linkGitHub } = useAuthStore();
  const { boards, columns, tasks } = useBoardStore();

  if (!user) return null;

  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Bilinmiyor';

  const lastSignIn = user.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Bilinmiyor';

  const provider = user.app_metadata?.provider ?? 'email';
  const providerLabel = provider === 'google' ? 'Google' : provider === 'github' ? 'GitHub' : 'E-posta';

  const userBoards = boards.length;
  const userColumns = columns.length;
  const userTasks = tasks.length;

  const initials = user.email?.charAt(0).toUpperCase() ?? '?';

  const identities = user.identities || [];
  const hasGoogle = identities.some(i => i.provider === 'google');
  const hasGitHub = identities.some(i => i.provider === 'github');

  const handleDeleteAccount = async () => {
    if (window.confirm('Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      await logout();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Profilim</h1>
        <p>Hesap bilgilerinizi ve istatistiklerinizi buradan görüntüleyebilirsiniz.</p>
      </div>

      <div className={styles.grid}>

        {/* Profil Kartı */}
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

        {/* Hesap Detayları */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}><Shield size={18} /></div>
            <h2>Hesap Detayları</h2>
          </div>
          <div className={styles.infoList}>
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}>
                <Mail size={12} style={{ display: 'inline', marginRight: 4 }} />
                E-posta
              </div>
              <div className={styles.infoValue}>{user.email}</div>
            </div>
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}>
                <Shield size={12} style={{ display: 'inline', marginRight: 4 }} />
                Giriş Yöntemi
              </div>
              <div className={styles.infoValue}>{providerLabel}</div>
            </div>
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}>
                <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />
                Kayıt Tarihi
              </div>
              <div className={styles.infoValue}>{createdAt}</div>
            </div>
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}>
                <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />
                Son Giriş
              </div>
              <div className={styles.infoValue}>{lastSignIn}</div>
            </div>
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}>Kullanıcı ID</div>
              <div className={styles.infoValue} style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {user.id.substring(0, 18)}…
              </div>
            </div>
          </div>
        </div>

        {/* İstatistikler */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}><BarChart3 size={18} /></div>
            <h2>İstatistikler</h2>
          </div>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>{userBoards}</div>
              <div className={styles.statLabel}>Pano</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>{userColumns}</div>
              <div className={styles.statLabel}>Sütun</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>{userTasks}</div>
              <div className={styles.statLabel}>Görev</div>
            </div>
          </div>
        </div>

        {/* Hesapları Bağla */}
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
              <button className={styles.secondaryBtn} disabled style={{ opacity: 0.6, cursor: 'default' }}>
                ✓ Google Hesabı Bağlı
              </button>
            ) : (
              <button className={styles.secondaryBtn} onClick={linkGoogle}>
                Google Hesabını Bağla
              </button>
            )}

            {hasGitHub ? (
              <button className={styles.secondaryBtn} disabled style={{ opacity: 0.6, cursor: 'default' }}>
                ✓ GitHub Hesabı Bağlı
              </button>
            ) : (
              <button className={styles.secondaryBtn} onClick={linkGitHub}>
                GitHub Hesabını Bağla
              </button>
            )}
          </div>
        </div>

        {/* Hesap Yönetimi */}
        <div className={`${styles.card} ${styles.dangerCard}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon} style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>
              <AlertTriangle size={18} />
            </div>
            <h2>Hesap Yönetimi</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button className={styles.secondaryBtn} onClick={logout}>
              Çıkış Yap
            </button>
            <button className={styles.dangerBtn} onClick={handleDeleteAccount}>
              Hesabı Kapat
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
