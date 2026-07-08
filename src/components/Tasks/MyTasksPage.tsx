'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkspace } from '@/hooks/api/useWorkspace';
import { getMyTasks } from '@/lib/workspace-stats';
import { CheckSquare, Calendar, LayoutDashboard } from 'lucide-react';
import styles from './Tasks.module.css';

function dueLabel(dueDate?: string) {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return { text: `${Math.abs(diff)} gün gecikti`, type: 'overdue' as const };
  if (diff === 0) return { text: 'Bugün', type: 'today' as const };
  if (diff === 1) return { text: 'Yarın', type: 'soon' as const };
  return {
    text: due.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
    type: 'normal' as const,
  };
}

export default function MyTasksPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: workspace, isLoading } = useWorkspace(user?.id ?? null, user?.email ?? null);

  const myTasks = useMemo(
    () => getMyTasks(workspace, user?.email),
    [workspace, user?.email]
  );

  const grouped = useMemo(() => {
    const overdue: typeof myTasks = [];
    const upcoming: typeof myTasks = [];
    const noDue: typeof myTasks = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    myTasks.forEach((task) => {
      if (!task.dueDate) {
        noDue.push(task);
        return;
      }
      const due = new Date(task.dueDate);
      due.setHours(0, 0, 0, 0);
      if (due < today) overdue.push(task);
      else upcoming.push(task);
    });

    return { overdue, upcoming, noDue };
  }, [myTasks]);

  if (isLoading) {
    return (
      <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.spinner} />
      </div>
    );
  }

  const renderGroup = (title: string, tasks: typeof myTasks) => {
    if (tasks.length === 0) return null;
    return (
      <section className={styles.group}>
        <h2>{title} <span className={styles.count}>{tasks.length}</span></h2>
        <ul className={styles.list}>
          {tasks.map((task) => {
            const due = dueLabel(task.dueDate);
            return (
              <li key={task.id}>
                <button
                  className={styles.taskCard}
                  onClick={() => router.push(`/boards/${task.boardId}`)}
                >
                  <div className={styles.taskMain}>
                    <span className={styles.taskTitle}>{task.title}</span>
                    <span className={styles.taskBoard}>
                      <LayoutDashboard size={13} />
                      {task.board?.title ?? 'Pano'}
                    </span>
                  </div>
                  {due ? (
                    <span className={`${styles.dueBadge} ${styles[`due_${due.type}`]}`}>
                      <Calendar size={12} />
                      {due.text}
                    </span>
                  ) : (
                    <span className={styles.noDue}>Tarih yok</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    );
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1>Bana Atananlar</h1>
        </div>
        <p>Size atanan tüm görevler — panolardan bağımsız tek listede.</p>
      </header>

      {myTasks.length === 0 ? (
        <div className={styles.empty}>
          <CheckSquare size={40} className={styles.emptyIcon} />
          <h3>Size atanmış görev yok</h3>
          <p>Bir kartta kendinizi sorumlu olarak atayın; burada görünecek.</p>
        </div>
      ) : (
        <div className={styles.groups}>
          {renderGroup('Geciken', grouped.overdue)}
          {renderGroup('Yaklaşan', grouped.upcoming)}
          {renderGroup('Tarihsiz', grouped.noDue)}
        </div>
      )}
    </div>
  );
}
