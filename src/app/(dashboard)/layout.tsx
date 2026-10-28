"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useBoardStore } from '@/store/useBoardStore';
import { useActiveBoard } from '@/hooks/useActiveBoard';
import { getLastBoardId } from '@/lib/preferences';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { MobileSidebarProvider } from '@/contexts/MobileSidebarContext';
import { useWorkspace } from '@/hooks/api/useWorkspace';
import { useRealtimeSync } from '@/hooks/api/useRealtimeSync';
import NotificationBell from '@/components/Notifications/NotificationBell';

import AppRail from '@/components/Navigation/AppRail';
import KanbanSidebar from '@/components/Navigation/KanbanSidebar';
import NotesSidebar from '@/components/Navigation/NotesSidebar';
import BottomTabBar from '@/components/Navigation/BottomTabBar';
import GlobalQuickCapture from '@/components/Navigation/GlobalQuickCapture';
import styles from '@/components/Navigation/Navigation.module.css';

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--glass-border)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const pathname = usePathname();

  const { theme } = useBoardStore();
  const { activeBoardId, setActiveBoard } = useActiveBoard();
  const { user, setUser } = useAuthStore();
  const router = useRouter();

  const { data: workspace, isLoading, isError } = useWorkspace(user?.id ?? null, user?.email ?? null);
  const boardIds = useMemo(() => workspace?.boards.map((b) => b.id) ?? [], [workspace?.boards]);

  useRealtimeSync(boardIds);

  useEffect(() => {
    setMounted(true);

    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (authUser) {
        setUser(authUser);
      }
      setAuthChecked(true);
    }).catch(() => {
      setAuthChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        window.location.href = '/login';
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme, mounted]);

  useEffect(() => {
    if (!workspace?.boards.length || !user?.id || activeBoardId) return;
    const lastId = getLastBoardId(user.id);
    const validLast = lastId && workspace.boards.some((b) => b.id === lastId);
    setActiveBoard(validLast ? lastId! : workspace.boards[0].id);
  }, [workspace, activeBoardId, setActiveBoard, user?.id]);

  if (!mounted || !authChecked) {
    return <LoadingSpinner />;
  }

  if (user && isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-secondary)' }}>
        Veriler yüklenirken bir hata oluştu. Sayfayı yenileyin.
      </div>
    );
  }

  const isNotesMode = pathname.startsWith('/notes');

  return (
    <MobileSidebarProvider>
      <main style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-primary)' }}>
        
        {/* DESKTOP NAVIGATION */}
        <AppRail />
        {isNotesMode ? <NotesSidebar /> : <KanbanSidebar />}

        {/* CONTENT AREA */}
        <div className={styles.contentArea}>
          <NotificationBell />
          {children}
        </div>

        {/* MOBILE NAVIGATION */}
        <BottomTabBar />
        <GlobalQuickCapture />

      </main>
    </MobileSidebarProvider>
  );
}
