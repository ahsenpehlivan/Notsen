'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PenSquare, Send, X, Hash } from 'lucide-react';
import { useNoteMutations, useNotes } from '@/hooks/api/useNotes';
import { usePathname } from 'next/navigation';
import styles from './Navigation.module.css';

export default function GlobalQuickCapture() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { addNote } = useNoteMutations();
  const { data: notes } = useNotes();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pathname = usePathname();

  const isNotesMode = pathname.startsWith('/notes');

  const popularTags = React.useMemo(() => {
    if (!notes) return [];
    const counts: Record<string, number> = {};
    notes.forEach(n => {
      n.tags.forEach(t => counts[t] = (counts[t] || 0) + 1);
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);
  }, [notes]);

  const insertTag = (tag: string) => {
    const space = input.endsWith(' ') || input === '' ? '' : ' ';
    setInput(prev => prev + space + '#' + tag + ' ');
    inputRef.current?.focus();
  };

  const insertHash = () => {
    const space = input.endsWith(' ') || input === '' ? '' : ' ';
    setInput(prev => prev + space + '#');
    inputRef.current?.focus();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    addNote.mutate(input.trim(), {
      onSuccess: () => {
        setInput('');
        setIsOpen(false);
      }
    });
  };

  if (isNotesMode) return null;

  return (
    <>
      <button 
        className={styles.quickCaptureFab} 
        onClick={() => setIsOpen(true)}
        title="Hızlı Not Al (Ctrl+Shift+N)"
      >
        <PenSquare size={24} />
      </button>

      {isOpen && (
        <div className={styles.quickCaptureBackdrop} onClick={() => setIsOpen(false)}>
          <div className={styles.quickCaptureModal} onClick={e => e.stopPropagation()}>
            <div className={styles.quickCaptureHeader}>
              <h3>Aklından geçeni yaz...</h3>
              <button onClick={() => setIsOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className={styles.quickCaptureForm}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ne düşünüyorsunuz? (#etiket ekleyebilirsiniz)"
                rows={3}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', alignItems: 'center' }}>
                  <button 
                    type="button"
                    onClick={insertHash}
                    style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: '12px', padding: '4px 10px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }}
                  >
                    <Hash size={14} /> Ekle
                  </button>
                  {popularTags.map(tag => (
                    <button 
                      key={tag}
                      type="button"
                      onClick={() => insertTag(tag)}
                      style={{ background: 'var(--bg-tertiary)', border: 'none', borderRadius: '12px', padding: '4px 10px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500, whiteSpace: 'nowrap' }}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
                <button 
                  type="submit" 
                  disabled={!input.trim() || addNote.isPending}
                  style={{ background: 'var(--accent-primary)', color: '#fff', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
