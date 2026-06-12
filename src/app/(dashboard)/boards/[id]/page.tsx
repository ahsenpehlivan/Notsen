"use client";

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import KanbanBoard from '@/components/Board/KanbanBoard';
import { useActiveBoard } from '@/hooks/useActiveBoard';

export default function BoardPage() {
  const params = useParams();
  const { setActiveBoard } = useActiveBoard();

  useEffect(() => {
    if (params.id && typeof params.id === 'string') {
      setActiveBoard(params.id);
    }
  }, [params.id, setActiveBoard]);

  return <KanbanBoard />;
}
