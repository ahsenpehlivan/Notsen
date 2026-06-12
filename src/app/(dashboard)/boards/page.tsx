"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkspace } from '@/hooks/api/useWorkspace';
import { getLastBoardId } from '@/lib/preferences';

export default function BoardsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: workspace, isLoading } = useWorkspace(user?.id ?? null, user?.email ?? null);
  const boards = workspace?.boards ?? [];

  useEffect(() => {
    if (isLoading) return;

    if (boards.length === 0) return;

    const lastId = user?.id ? getLastBoardId(user.id) : null;
    const target = boards.find((b) => b.id === lastId)?.id ?? boards[0].id;
    router.replace(`/boards/${target}`);
  }, [boards, isLoading, router, user?.id]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        <div style={{ width: 36, height: 36, border: '3px solid var(--glass-border)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        Henüz bir panonuz yok. Sol menüden yeni bir pano oluşturun.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--glass-border)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );
}
