import type { Board, Column, Task } from '@/types/board';

function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function safeFilename(title: string) {
  return title.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s-]/g, '').trim().replace(/\s+/g, '-') || 'pano';
}

export function exportBoardJSON(board: Board, columns: Column[], tasks: Task[]) {
  const boardCols = columns.filter((c) => c.boardId === board.id);
  const boardTasks = tasks.filter((t) => t.boardId === board.id);

  const payload = {
    exportedAt: new Date().toISOString(),
    board: { id: board.id, title: board.title, labels: board.labels },
    columns: boardCols,
    tasks: boardTasks,
  };

  download(
    JSON.stringify(payload, null, 2),
    `${safeFilename(board.title)}-notsen.json`,
    'application/json'
  );
}

export function exportBoardCSV(board: Board, columns: Column[], tasks: Task[]) {
  const boardCols = columns.filter((c) => c.boardId === board.id);
  const colMap = new Map(boardCols.map((c) => [c.id, c.title]));
  const boardTasks = tasks.filter((t) => t.boardId === board.id);

  const header = 'Başlık,Sütun,Son Tarih,Sorumlu,Etiketler,Açıklama';
  const rows = boardTasks.map((t) => {
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    return [
      escape(t.title),
      escape(colMap.get(t.columnId) || ''),
      escape(t.dueDate || ''),
      escape(t.assignee || ''),
      escape((t.tags || []).join('; ')),
      escape(t.description || ''),
    ].join(',');
  });

  const csv = '\uFEFF' + [header, ...rows].join('\n');
  download(csv, `${safeFilename(board.title)}-notsen.csv`, 'text/csv;charset=utf-8');
}
