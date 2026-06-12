"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar/Sidebar';
import { useBoardStore } from '@/store/useBoardStore';
import { useActiveBoard } from '@/hooks/useActiveBoard';
import { getLastBoardId } from '@/lib/preferences';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { MobileSidebarProvider } from '@/contexts/MobileSidebarContext';
import { useWorkspace } from '@/hooks/api/useWorkspace';
import { useRealtimeSync } from '@/hooks/api/useRealtimeSync';
import NotificationBell from '@/components/Notifications/NotificationBell';

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

  const { theme } = useBoardStore();
  const { activeBoardId, setActiveBoard } = useActiveBoard();
  const { user, setUser } = useAuthStore();
  const router = useRouter();

  const { data: workspace, isLoading, isError } = useWorkspace(user?.id ?? null, user?.email ?? null);
  const boardIds = workspace?.boards.map((b) => b.id) ?? [];

  useRealtimeSync(boardIds);

  useEffect(() => {
    setMounted(true);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, router]);

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

  if (!mounted) {
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

  return (
    <MobileSidebarProvider>
      <main style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-primary)' }}>
        <Sidebar />
        <div style={{ flex: 1, height: '100vh', overflow: 'hidden', position: 'relative' }}>
          <NotificationBell />
          {children}
        </div>
      </main>
    </MobileSidebarProvider>
  );
}
