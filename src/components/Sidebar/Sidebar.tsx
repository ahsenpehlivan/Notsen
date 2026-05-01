import React, { useState } from 'react';
import Image from 'next/image';
import { useBoardStore, ThemeName } from '@/store/useBoardStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Plus, LayoutDashboard, Trash2, LogOut, UserCircle } from 'lucide-react';
import styles from './Sidebar.module.css';

interface SidebarProps {
  activePage: 'boards' | 'profile';
  onPageChange: (page: 'boards' | 'profile') => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ activePage, onPageChange, isOpen, onClose }: SidebarProps) {
  const { boards, activeBoardId, addBoard, deleteBoard, setActiveBoard, theme, setTheme, unsubscribeFromRealtime } = useBoardStore();
  const { user, logout } = useAuthStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');

  const THEMES: { id: ThemeName; label: string; swatch: string }[] = [
    { id: 'charcoal',     label: 'Charcoal',       swatch: '#221c1c' },
    { id: 'midnight',     label: 'Midnight',        swatch: '#161B22' },
    { id: 'cream-slate',  label: 'Cream & Slate',   swatch: '#c8bfa8' },
    { id: 'stone-indigo', label: 'Stone & Indigo',  swatch: '#4361EE' },
    { id: 'warm-linen',   label: 'Warm Linen',      swatch: '#d4c5a9' },
  ];

  const handleAddBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newBoardTitle.trim() && user) {
      await addBoard(user.id, newBoardTitle.trim());
      setNewBoardTitle('');
      setIsAdding(false);
    }
  };

  const handleThemeChange = (t: ThemeName) => {
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
  };

  return (
    <>
      <div 
        className={`${styles.sidebarOverlay} ${isOpen ? styles.overlayActive : ''}`} 
        onClick={onClose} 
      />
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <Image src="/icon.png" alt="Notsen Logo" width={28} height={28} style={{ borderRadius: '6px' }} />
          <h1>Notsen</h1>
        </div>
      </div>

      {/* Ana Navigasyon */}
      <nav className={styles.nav}>
        <button
          className={`${styles.navBtn} ${activePage === 'boards' ? styles.navBtnActive : ''}`}
          onClick={() => onPageChange('boards')}
        >
          <LayoutDashboard size={18} /> Panolarım
        </button>
        <button
          className={`${styles.navBtn} ${activePage === 'profile' ? styles.navBtnActive : ''}`}
          onClick={() => onPageChange('profile')}
        >
          <UserCircle size={18} /> Profilim
        </button>
      </nav>

      {/* Panolar - sadece boards sayfasındayken göster */}
      {activePage === 'boards' && (
        <div className={styles.boardsSection}>
          <div className={styles.sectionHeader}>
            <h3>PANOLARIM ({boards.length})</h3>
            <button className={styles.iconBtn} onClick={() => setIsAdding(!isAdding)} title="Yeni Pano Ekle">
              <Plus size={16} />
            </button>
          </div>

          {isAdding && (
            <form onSubmit={handleAddBoard} className={styles.addBoardForm}>
              <input
                type="text"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                placeholder="Pano adı..."
                autoFocus
              />
              <div className={styles.formActions}>
                <button type="submit" className={styles.saveBtn}>Ekle</button>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsAdding(false)}>İptal</button>
              </div>
            </form>
          )}

          <ul className={styles.boardList}>
            {boards.map(board => (
              <li
                key={board.id}
                className={`${styles.boardItem} ${board.id === activeBoardId ? styles.active : ''}`}
              >
                <button
                  className={styles.boardLink}
                  onClick={() => setActiveBoard(board.id)}
                >
                  <LayoutDashboard size={18} />
                  <span className={styles.boardTitle}>{board.title}</span>
                </button>
                {boards.length > 1 && (
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`"${board.title}" panosunu silmek istediğinize emin misiniz?`)) {
                        deleteBoard(board.id);
                      }
                    }}
                    title="Panoyu Sil"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.footer}>
        <div className={styles.themePicker}>
          <span className={styles.themePickerLabel}>Tema</span>
          <div className={styles.themeSwatches}>
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => handleThemeChange(t.id)}
                className={`${styles.themeSwatch} ${theme === t.id ? styles.themeSwatchActive : ''}`}
                title={t.label}
                style={{ background: t.swatch }}
              />
            ))}
          </div>
        </div>

        <div className={styles.userInfo}>
          <div className={styles.avatar}>{user?.email?.charAt(0).toUpperCase()}</div>
          <div className={styles.userDetails}>
            <span className={styles.userName}>{user?.email}</span>
            <button onClick={() => { unsubscribeFromRealtime(); logout(); }} className={styles.logoutBtn}>
              <LogOut size={14} /> Çıkış
            </button>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}
