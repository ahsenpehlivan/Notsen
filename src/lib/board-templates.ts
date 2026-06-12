import type { BoardLabel } from '@/types/board';
import { PASTEL_COLORS } from '@/lib/board-mappers';

const gid = () => Math.random().toString(36).substring(2, 9);

export interface TemplateTask {
  title: string;
  description?: string;
  tags?: string[];
}

export interface TemplateColumn {
  title: string;
  tasks?: TemplateTask[];
}

export interface BoardTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  columns: TemplateColumn[];
  labels: BoardLabel[];
}

export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: 'blank',
    name: 'Boş Pano',
    description: 'Klasik To Do / In Progress / Done sütunları',
    emoji: '📋',
    columns: [
      { title: 'To Do' },
      { title: 'In Progress' },
      { title: 'Done' },
    ],
    labels: [
      { id: gid(), name: 'Bug', color: PASTEL_COLORS[0] },
      { id: gid(), name: 'Feature', color: PASTEL_COLORS[3] },
    ],
  },
  {
    id: 'sprint',
    name: 'Yazılım Sprint',
    description: 'Agile sprint planlaması için hazır yapı',
    emoji: '🚀',
    columns: [
      {
        title: 'Backlog',
        tasks: [
          { title: 'Kullanıcı hikayelerini yaz', tags: ['Feature'] },
          { title: 'Teknik borçları listele', tags: ['Bug'] },
        ],
      },
      {
        title: 'Sprint',
        tasks: [
          { title: 'API entegrasyonu', tags: ['Feature'] },
          { title: 'Unit testler', tags: ['Feature'] },
        ],
      },
      { title: 'Review' },
      { title: 'Done' },
    ],
    labels: [
      { id: gid(), name: 'Bug', color: PASTEL_COLORS[0] },
      { id: gid(), name: 'Feature', color: PASTEL_COLORS[3] },
      { id: gid(), name: 'Acil', color: PASTEL_COLORS[1] },
    ],
  },
  {
    id: 'content',
    name: 'İçerik Planı',
    description: 'Blog, sosyal medya ve video içerik takibi',
    emoji: '✍️',
    columns: [
      {
        title: 'Fikirler',
        tasks: [
          { title: 'Haftalık konu brainstorm', tags: ['Tasarım'] },
        ],
      },
      {
        title: 'Yazılıyor',
        tasks: [{ title: 'Blog taslağı', tags: ['Feature'] }],
      },
      { title: 'Onay' },
      { title: 'Yayında' },
    ],
    labels: [
      { id: gid(), name: 'Blog', color: PASTEL_COLORS[3] },
      { id: gid(), name: 'Sosyal', color: PASTEL_COLORS[4] },
      { id: gid(), name: 'Video', color: PASTEL_COLORS[5] },
    ],
  },
  {
    id: 'personal',
    name: 'Kişisel Görevler',
    description: 'Günlük işler ve alışkanlık takibi',
    emoji: '🏠',
    columns: [
      {
        title: 'Bugün',
        tasks: [
          { title: 'E-postaları kontrol et' },
          { title: '30 dk egzersiz' },
        ],
      },
      { title: 'Bu Hafta' },
      { title: 'Tamamlandı' },
    ],
    labels: [
      { id: gid(), name: 'İş', color: PASTEL_COLORS[3] },
      { id: gid(), name: 'Kişisel', color: PASTEL_COLORS[2] },
    ],
  },
];

export function getTemplate(id: string): BoardTemplate {
  return BOARD_TEMPLATES.find((t) => t.id === id) ?? BOARD_TEMPLATES[0];
}
