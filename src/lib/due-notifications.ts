import type { WorkspaceData } from '@/types/board';

export type NotificationType = 'overdue' | 'today' | 'tomorrow';

export interface DueNotification {
  id: string;
  type: NotificationType;
  taskId: string;
  boardId: string;
  taskTitle: string;
  boardTitle: string;
  dueDate: string;
  message: string;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dateKey(d: Date) {
  return d.toISOString().split('T')[0];
}

export function getDueNotifications(workspace: WorkspaceData | undefined): DueNotification[] {
  if (!workspace) return [];

  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const boardMap = new Map(workspace.boards.map((b) => [b.id, b.title]));
  const items: DueNotification[] = [];

  workspace.tasks.forEach((task) => {
    if (!task.dueDate) return;
    const due = startOfDay(new Date(task.dueDate));
    const boardTitle = boardMap.get(task.boardId) || 'Pano';

    if (due < today) {
      const days = Math.round((today.getTime() - due.getTime()) / 86400000);
      items.push({
        id: `overdue-${task.id}`,
        type: 'overdue',
        taskId: task.id,
        boardId: task.boardId,
        taskTitle: task.title,
        boardTitle,
        dueDate: task.dueDate,
        message: `${days} gün gecikti`,
      });
    } else if (dateKey(due) === dateKey(today)) {
      items.push({
        id: `today-${task.id}`,
        type: 'today',
        taskId: task.id,
        boardId: task.boardId,
        taskTitle: task.title,
        boardTitle,
        dueDate: task.dueDate,
        message: 'Bugün bitiyor',
      });
    } else if (dateKey(due) === dateKey(tomorrow)) {
      items.push({
        id: `tomorrow-${task.id}`,
        type: 'tomorrow',
        taskId: task.id,
        boardId: task.boardId,
        taskTitle: task.title,
        boardTitle,
        dueDate: task.dueDate,
        message: 'Yarın bitiyor',
      });
    }
  });

  const order: Record<NotificationType, number> = { overdue: 0, today: 1, tomorrow: 2 };
  return items.sort((a, b) => order[a.type] - order[b.type]);
}

const DISMISSED_KEY = 'notsen-dismissed-notifications';
const BROWSER_NOTIFIED_KEY = 'notsen-browser-notified-date';

export function getDismissedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function dismissNotification(id: string) {
  const set = getDismissedIds();
  set.add(id);
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]));
}

export function clearDismissedIfNewDay() {
  const today = dateKey(new Date());
  const stored = localStorage.getItem(DISMISSED_KEY + '-date');
  if (stored !== today) {
    localStorage.setItem(DISMISSED_KEY, '[]');
    localStorage.setItem(DISMISSED_KEY + '-date', today);
  }
}

export function shouldShowBrowserNotification(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  const today = dateKey(new Date());
  return localStorage.getItem(BROWSER_NOTIFIED_KEY) !== today;
}

export function markBrowserNotified() {
  localStorage.setItem(BROWSER_NOTIFIED_KEY, dateKey(new Date()));
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function showBrowserNotification(title: string, body: string) {
  if (Notification.permission !== 'granted') return;
  new Notification(title, { body, icon: '/icon.png', tag: 'notsen-due' });
}
