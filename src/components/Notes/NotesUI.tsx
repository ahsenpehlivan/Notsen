'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNotes, useNoteMutations } from '@/hooks/api/useNotes';
import { Search, Send, MoreVertical, Edit2, Trash2, X } from 'lucide-react';
import styles from './Notes.module.css';
import { useMobileSidebar } from '@/contexts/MobileSidebarContext';
import { Menu } from 'lucide-react';

export default function NotesUI() {
  const { data: notes, isLoading } = useNotes();
  const { addNote, updateNote, deleteNote } = useNoteMutations();
  const { openSidebar } = useMobileSidebar();

  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

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
    return notes.filter(note => {
      if (activeTag && !note.tags.includes(activeTag)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!note.content.toLowerCase().includes(q) && !note.tags.some(t => t.toLowerCase().includes(q))) {
          return false;
        }
      }
      return true;
    });
  }, [notes, activeTag, searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    addNote.mutate(input.trim());
    setInput('');
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
          <button className={styles.menuBtn} onClick={openSidebar}>
            <Menu size={24} />
          </button>
          <div className={styles.headerTitle}>
            <h1>Hızlı Notlar</h1>
            <p>Aklınıza gelenleri yazın, #etiket ile gruplayın.</p>
          </div>
        </div>

        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Notlarda ara..." 
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

        {allTags.length > 0 && (
          <div className={styles.tagsContainer}>
            <button 
              className={`${styles.tagBtn} ${!activeTag ? styles.tagActive : ''}`}
              onClick={() => setActiveTag(null)}
            >
              Tümü
            </button>
            {allTags.map(tag => (
              <button 
                key={tag}
                className={`${styles.tagBtn} ${activeTag === tag ? styles.tagActive : ''}`}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
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
        <form onSubmit={handleSubmit} className={styles.inputForm}>
          <textarea 
            className={styles.inputField}
            placeholder="Hızlıca bir not alın... (#etiket ekleyebilirsiniz)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            rows={1}
          />
          <button 
            type="submit" 
            className={styles.sendBtn}
            disabled={!input.trim() || addNote.isPending}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
