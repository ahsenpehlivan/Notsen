import React, { useState } from 'react';
import { useBoardStore, PASTEL_COLORS, BoardLabel } from '@/store/useBoardStore';
import { X, Trash2, Edit2, Plus } from 'lucide-react';
import styles from './Board.module.css';

interface LabelsManagerModalProps {
  boardId: string;
  onClose: () => void;
}

export default function LabelsManagerModal({ boardId, onClose }: LabelsManagerModalProps) {
  const { boards, updateBoardLabels } = useBoardStore();
  const board = boards.find(b => b.id === boardId);
  const labels = board?.labels || [];

  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PASTEL_COLORS[0]);

  if (!board) return null;

  const handleSaveEdit = (label: BoardLabel) => {
    if (!editName.trim()) return;
    const newLabels = labels.map(l => l.id === label.id ? { ...l, name: editName.trim(), color: editColor } : l);
    // If name changed, pass old and new name for task migration
    const oldName = label.name !== editName.trim() ? label.name : undefined;
    const updatedName = label.name !== editName.trim() ? editName.trim() : undefined;
    updateBoardLabels(boardId, newLabels, oldName, updatedName);
    setEditingLabelId(null);
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    const newLabel: BoardLabel = {
      id: Math.random().toString(36).substring(2, 9),
      name: newName.trim(),
      color: newColor
    };
    updateBoardLabels(boardId, [...labels, newLabel]);
    setNewName('');
    setIsAdding(false);
  };

  const handleDelete = (label: BoardLabel) => {
    if (window.confirm(`"${label.name}" etiketini silmek istediğinize emin misiniz? Bu işlem mevcut görevlerden de bu etiketi kaldırır.`)) {
      const newLabels = labels.filter(l => l.id !== label.id);
      updateBoardLabels(boardId, newLabels, label.name);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
        <header className={styles.modalHeader}>
          <h2>Etiketleri Düzenle</h2>
          <button className={styles.iconBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className={styles.modalBody}>
          <div className={styles.labelsList} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {labels.map(label => (
              <div key={label.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editingLabelId === label.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                    <input 
                      type="text" 
                      value={editName} 
                      onChange={e => setEditName(e.target.value)} 
                      style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-main)' }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {PASTEL_COLORS.map(c => (
                        <button 
                          key={c}
                          onClick={() => setEditColor(c)}
                          type="button"
                          style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: c, border: editColor === c ? '2px solid white' : '2px solid transparent', cursor: 'pointer' }}
                        />
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                      <button type="button" onClick={() => setEditingLabelId(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px' }}>İptal</button>
                      <button type="button" onClick={() => handleSaveEdit(label)} style={{ background: 'var(--accent-main)', border: 'none', color: 'white', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>Kaydet</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                      <span style={{ backgroundColor: label.color, color: '#1E293B', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                        {label.name}
                      </span>
                    </div>
                    <button 
                      type="button"
                      className={styles.iconBtn} 
                      onClick={() => { setEditingLabelId(label.id); setEditName(label.name); setEditColor(label.color); }}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button type="button" className={styles.iconBtn} onClick={() => handleDelete(label)} style={{ color: 'var(--danger)' }}>
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            ))}

            {isAdding ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', marginTop: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>Yeni Etiket</h4>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  placeholder="Etiket Adı"
                  style={{ padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-main)' }}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: '6px' }}>
                  {PASTEL_COLORS.map(c => (
                    <button 
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: c, border: newColor === c ? '2px solid white' : '2px solid transparent', cursor: 'pointer' }}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <button type="button" onClick={() => setIsAdding(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px' }}>İptal</button>
                  <button type="button" onClick={handleAdd} style={{ background: 'var(--accent-main)', border: 'none', color: 'white', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>Ekle</button>
                </div>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => setIsAdding(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', background: 'transparent', border: '1px dashed var(--border)', color: 'var(--text-secondary)', borderRadius: '6px', cursor: 'pointer', marginTop: '8px', justifyContent: 'center' }}
              >
                <Plus size={16} /> Yeni Etiket Ekle
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
