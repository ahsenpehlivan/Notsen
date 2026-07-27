'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNotes, useNoteMutations } from '@/hooks/api/useNotes';
import { Search, Send, MoreVertical, Edit2, Trash2, X, RefreshCw, Hash } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './Notes.module.css';
import { useAuthStore } from '@/store/useAuthStore';
import { useWorkspace } from '@/hooks/api/useWorkspace';
import { useTaskMutations } from '@/hooks/api/useBoardMutations';

export default function NotesUI() {
  const { data: notes, isLoading } = useNotes();
  const { addNote, updateNote, deleteNote } = useNoteMutations();
  const searchParams = useSearchParams();
  const currentFilter = searchParams.get('filter') || 'all';
  const currentTag = searchParams.get('tag');

  const { user } = useAuthStore();
  const { data: workspace } = useWorkspace(user?.id ?? null, user?.email ?? null);
  const { addTask } = useTaskMutations();

  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Convert to task modal state
  const [convertToTaskId, setConvertToTaskId] = useState<string | null>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [selectedColumnId, setSelectedColumnId] = useState<string>('');

  // Tag suggestion state
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);

  // Otomatik scroll: Yeni mesaj eklendiğinde en alta kaydır.
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [notes?.length]);

  const allTags = useMemo(() => {
    if (!notes) return [];
    const tags = new Set<string>();
    notes.forEach(note => {
      note.tags.forEach(t => tags.add(t));
    });
    return Array.from(tags).sort();
  }, [notes]);

  const filteredNotes = useMemo(() => {
    if (!notes) return [];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    return notes.filter(note => {
      // Exclude converted/archived tasks from main view unless specifically asked
      if (note.archived) return false;

      if (currentTag && !note.tags.includes(currentTag)) return false;
      
      if (currentFilter === 'today') {
        const d = new Date(note.created_at);
        if (d < today) return false;
      } else if (currentFilter === 'yesterday') {
        const d = new Date(note.created_at);
        if (d < yesterday || d >= today) return false;
      } else if (currentFilter === 'week') {
        const d = new Date(note.created_at);
        if (d < lastWeek) return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!note.content.toLowerCase().includes(q) && !note.tags.some(t => t.toLowerCase().includes(q))) {
          return false;
        }
      }
      return true;
    });
  }, [notes, currentTag, currentFilter, searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    // Hashtag suggestion logic
    const lastWordMatch = val.match(/#(\w*)$/);
    if (lastWordMatch) {
      const partialTag = lastWordMatch[1].toLowerCase();
      const suggestions = allTags.filter(t => t.toLowerCase().startsWith(`#${partialTag}`) || t.toLowerCase().startsWith(partialTag));
      setSuggestedTags(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (tag: string) => {
    const newVal = input.replace(/#\w*$/, tag) + ' ';
    setInput(newVal);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const insertTag = (tag: string) => {
    const space = input.endsWith(' ') || input === '' ? '' : ' ';
    setInput(prev => prev + space + tag + ' ');
    inputRef.current?.focus();
  };

  const insertHash = () => {
    const space = input.endsWith(' ') || input === '' ? '' : ' ';
    setInput(prev => prev + space + '#');
    inputRef.current?.focus();
  };

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const popularTags = useMemo(() => {
    if (!notes) return [];
    const counts: Record<string, number> = {};
    notes.forEach(n => {
      n.tags.forEach(t => counts[t] = (counts[t] || 0) + 1);
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(entry => entry[0]);
  }, [notes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    addNote.mutate(input.trim());
    setInput('');
  };

  const handleConvertToTask = () => {
    if (!convertToTaskId || !selectedBoardId || !selectedColumnId) return;
    
    const note = notes?.find(n => n.id === convertToTaskId);
    if (!note) return;

    addTask.mutate({
      boardId: selectedBoardId,
      columnId: selectedColumnId,
      title: note.content.substring(0, 50) + (note.content.length > 50 ? '...' : ''),
      description: note.content,
      tags: note.tags,
    }, {
      onSuccess: () => {
        // Mark note as archived and save converted id
        // @ts-expect-error type missing
        updateNote.mutate({ id: note.id, content: note.content, archived: true, converted_task_id: convertToTaskId });
        setConvertToTaskId(null);
      }
    });
  };

  const handleSaveEdit = (id: string) => {
    if (!editInput.trim()) return;
    updateNote.mutate({ id, content: editInput.trim() });
    setEditingId(null);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('tr-TR', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short'
    }).format(d);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerTitle}>
            <h1>Hızlı Notlar</h1>
            <p>Aklınıza gelenleri yazın, #etiket ile gruplayın.</p>
          </div>
        </div>

        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Notlarda veya etiketlerde ara..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button className={styles.clearSearch} onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>
      </header>

      <div className={styles.listContainer} ref={listRef}>
        {isLoading ? (
          <div className={styles.loading}>Yükleniyor...</div>
        ) : filteredNotes.length === 0 ? (
          <div className={styles.empty}>
            <p>Henüz not yok veya filtreye uygun sonuç bulunamadı.</p>
          </div>
        ) : (
          <div className={styles.notesList}>
            {/* Reverse display so newest is at bottom like a chat, since order is descending from DB, we reverse it here to show chronological top-down, but it depends on preference. 
                Wait, DB order is descending (newest first). Let's display it as a feed: newest at top, or chat: newest at bottom.
                WhatsApp is chat (newest at bottom). Let's reverse the array.
            */}
            {[...filteredNotes].reverse().map(note => (
              <div key={note.id} className={styles.noteCard}>
                {editingId === note.id ? (
                  <div className={styles.editWrap}>
                    <textarea 
                      className={styles.editInput}
                      value={editInput}
                      onChange={e => setEditInput(e.target.value)}
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSaveEdit(note.id);
                        }
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                    <div className={styles.editActions}>
                      <button className={styles.saveBtn} onClick={() => handleSaveEdit(note.id)}>Kaydet</button>
                      <button className={styles.cancelBtn} onClick={() => setEditingId(null)}>İptal</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.noteContent}>
                      {note.content.split(/(\s+)/).map((word, i) => {
                        if (word.startsWith('#')) {
                          return <span key={i} className={styles.hashtag}>{word}</span>;
                        }
                        return word;
                      })}
                    </div>
                    <div className={styles.noteFooter}>
                      <span className={styles.noteDate}>{formatDate(note.created_at)}</span>
                      <div className={styles.noteOptionsWrap}>
                        <button 
                          className={styles.optionsBtn}
                          onClick={() => setActiveDropdown(activeDropdown === note.id ? null : note.id)}
                        >
                          <MoreVertical size={14} />
                        </button>
                        {activeDropdown === note.id && (
                          <>
                            <div className={styles.dropdownBackdrop} onClick={() => setActiveDropdown(null)} />
                            <div className={styles.dropdownMenu}>
                                <button onClick={() => {
                                setConvertToTaskId(note.id);
                                setActiveDropdown(null);
                              }}>
                                <RefreshCw size={14} /> Göreve Dönüştür
                              </button>
                              <button onClick={() => {
                                setEditInput(note.content);
                                setEditingId(note.id);
                                setActiveDropdown(null);
                              }}>
                                <Edit2 size={14} /> Düzenle
                              </button>
                              <button onClick={() => {
                                if(window.confirm('Bu notu silmek istediğinize emin misiniz?')) {
                                  deleteNote.mutate(note.id);
                                }
                                setActiveDropdown(null);
                              }} className={styles.deleteOption}>
                                <Trash2 size={14} /> Sil
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.inputArea}>
        {showSuggestions && suggestedTags.length > 0 && (
          <div className={styles.suggestionsPopup}>
            {suggestedTags.map(t => (
              <button key={t} onClick={() => handleSelectSuggestion(t)}>{t}</button>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className={styles.inputForm}>
          <textarea 
            ref={inputRef}
            className={styles.inputField}
            placeholder="Hızlıca bir not alın... (#etiket ekleyebilirsiniz)"
            value={input}
            onChange={handleInputChange}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            rows={2}
          />
          <div className={styles.inputActions}>
            <div className={styles.quickTags}>
              <button 
                type="button"
                onClick={insertHash}
                className={styles.quickTagBtn}
                title="Etiket Ekle"
              >
                <Hash size={14} /> Ekle
              </button>
              {popularTags.map(tag => (
                <button 
                  key={tag}
                  type="button"
                  onClick={() => insertTag('#' + tag)}
                  className={styles.quickTagBtn}
                >
                  #{tag}
                </button>
              ))}
            </div>
            <button 
              type="submit" 
              className={styles.sendBtn}
              disabled={!input.trim() || addNote.isPending}
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>

      {convertToTaskId && (
        <div className={styles.dropdownBackdrop} onClick={() => setConvertToTaskId(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px', minWidth: '300px' }}>
            <h3 style={{ marginBottom: '1rem' }}>Göreve Dönüştür</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <select 
                value={selectedBoardId} 
                onChange={e => {
                  setSelectedBoardId(e.target.value);
                  setSelectedColumnId('');
                }}
                className={styles.searchInput}
              >
                <option value="">Pano Seçiniz</option>
                {workspace?.boards.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
              </select>

              <select 
                value={selectedColumnId} 
                onChange={e => setSelectedColumnId(e.target.value)}
                disabled={!selectedBoardId}
                className={styles.searchInput}
              >
                <option value="">Sütun Seçiniz</option>
                {workspace?.columns.filter(c => c.boardId === selectedBoardId).map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button 
                  onClick={handleConvertToTask}
                  disabled={!selectedBoardId || !selectedColumnId || addTask.isPending}
                  className={styles.saveBtn}
                  style={{ flex: 1 }}
                >
                  Dönüştür
                </button>
                <button onClick={() => setConvertToTaskId(null)} className={styles.cancelBtn} style={{ flex: 1 }}>İptal</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
