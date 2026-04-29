"use client";

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useBoardStore } from '@/store/useBoardStore';
import { supabase } from '@/lib/supabase';
import Login from '@/components/Auth/Login';
import KanbanBoard from '@/components/Board/KanbanBoard';
import Sidebar from '@/components/Sidebar/Sidebar';
import ProfilePage from '@/components/Profile/ProfilePage';
import styles from './page.module.css';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activePage, setActivePage] = useState<'boards' | 'profile'>('boards');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, setUser } = useAuthStore();
  const { theme, loadUserData } = useBoardStore();

  useEffect(() => {
    setMounted(true);

    // Mevcut oturumu kontrol et
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user.id, session.user.email || '');
      }
    });

    // Oturum değişikliklerini dinle (giriş/çıkış/OAuth redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user.id, session.user.email || '');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme, mounted]);

  if (!mounted) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <main className={styles.mainAppContainer}>
      <Sidebar 
        activePage={activePage} 
        onPageChange={(page) => {
          setActivePage(page);
          setIsSidebarOpen(false); // mobilde sayfa değişince menüyü kapat
        }} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      {activePage === 'boards' ? (
        <KanbanBoard onOpenMenu={() => setIsSidebarOpen(true)} />
      ) : (
        <ProfilePage onOpenMenu={() => setIsSidebarOpen(true)} />
      )}
    </main>
  );
}
