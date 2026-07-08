'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkspace } from '@/hooks/api/useWorkspace';
import { getTasksByDate } from '@/lib/workspace-stats';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import styles from './Calendar.module.css';

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: workspace, isLoading } = useWorkspace(user?.id ?? null, user?.email ?? null);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(toDateKey(today.getFullYear(), today.getMonth(), today.getDate()));

  const tasksByDate = useMemo(() => getTasksByDate(workspace), [workspace]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const days: { day: number; inMonth: boolean; key: string }[] = [];

    for (let i = 0; i < startOffset; i++) {
      const d = new Date(viewYear, viewMonth, -startOffset + i + 1);
      days.push({
        day: d.getDate(),
        inMonth: false,
        key: toDateKey(d.getFullYear(), d.getMonth(), d.getDate()),
      });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push({ day: d, inMonth: true, key: toDateKey(viewYear, viewMonth, d) });
    }

    while (days.length % 7 !== 0) {
      const next = days.length - startOffset - lastDay.getDate() + 1;
      const d = new Date(viewYear, viewMonth + 1, next);
      days.push({
        day: d.getDate(),
        inMonth: false,
        key: toDateKey(d.getFullYear(), d.getMonth(), d.getDate()),
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  const selectedTasks = tasksByDate.get(selectedDate) ?? [];
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  if (isLoading) {
    return (
      <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1>Takvim</h1>
        </div>
        <p>Son tarihi olan görevlerinizi aylık görünümde takip edin.</p>
      </header>

      <div className={styles.layout}>
        <div className={styles.calendarCard}>
          <div className={styles.monthNav}>
            <button onClick={prevMonth} className={styles.navBtn} aria-label="Önceki ay">
              <ChevronLeft size={18} />
            </button>
            <h2>{MONTHS[viewMonth]} {viewYear}</h2>
            <button onClick={nextMonth} className={styles.navBtn} aria-label="Sonraki ay">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className={styles.weekdays}>
            {WEEKDAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className={styles.grid}>
            {calendarDays.map(({ day, inMonth, key }) => {
              const count = tasksByDate.get(key)?.length ?? 0;
              const isToday = key === todayKey;
              const isSelected = key === selectedDate;
              return (
                <button
                  key={key}
                  className={`${styles.dayCell} ${!inMonth ? styles.dayMuted : ''} ${isToday ? styles.dayToday : ''} ${isSelected ? styles.daySelected : ''}`}
                  onClick={() => setSelectedDate(key)}
                >
                  <span className={styles.dayNum}>{day}</span>
                  {count > 0 && (
                    <span className={styles.dayDots}>
                      {count <= 3
                        ? Array.from({ length: count }).map((_, i) => <i key={i} />)
                        : <i className={styles.dotMany} />}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <aside className={styles.sidePanel}>
          <h3>
            <CalendarIcon size={16} />
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('tr-TR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </h3>

          {selectedTasks.length === 0 ? (
            <p className={styles.emptyDay}>Bu gün için görev yok.</p>
          ) : (
            <ul className={styles.taskList}>
              {selectedTasks.map((task) => (
                <li key={task.id}>
                  <button
                    className={styles.taskItem}
                    onClick={() => router.push(`/boards/${task.boardId}`)}
                  >
                    <span className={styles.taskTitle}>{task.title}</span>
                    <span className={styles.taskBoard}>{task.board?.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
