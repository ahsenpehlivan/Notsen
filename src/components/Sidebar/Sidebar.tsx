import React, { useState } from 'react';
import { useBoardStore } from '@/store/useBoardStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Plus, LayoutDashboard, Trash2, Sun, Moon, LogOut, UserCircle } from 'lucide-react';
import styles from './Sidebar.module.css';

interface SidebarProps {
  activePage: 'boards' | 'profile';
  onPageChange: (page: 'boards' | 'profile') => void;
}

export default function Sidebar({ activePage, onPageChange }: SidebarProps) {
  const { boards, activeBoardId, addBoard, deleteBoard, setActiveBoard, theme, setTheme } = useBoardStore();
  const { user, logout } = useAuthStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');

  const handleAddBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newBoardTitle.trim() && user) {
      await addBoard(user.id, newBoardTitle.trim());
      setNewBoardTitle('');
      setIsAdding(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>TF</div>
          <h1>TaskFlow</h1>
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
        <button className={styles.themeToggle} onClick={toggleTheme}>
          {theme === 'dark' ? (
            <><Sun size={18} /> <span>Aydınlık Tema</span></>
          ) : (
            <><Moon size={18} /> <span>Karanlık Tema</span></>
          )}
        </button>

        <div className={styles.userInfo}>
          <div className={styles.avatar}>{user?.email?.charAt(0).toUpperCase()}</div>
          <div className={styles.userDetails}>
            <span className={styles.userName}>{user?.email}</span>
            <button onClick={logout} className={styles.logoutBtn}>
              <LogOut size={14} /> Çıkış
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
