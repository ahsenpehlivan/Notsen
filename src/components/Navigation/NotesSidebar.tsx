'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useNotes } from '@/hooks/api/useNotes';
import { Star, Inbox, Clock, Hash } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './Navigation.module.css';

export default function NotesSidebar() {
  const { data: notes } = useNotes();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentFilter = searchParams.get('filter') || 'all';
  const currentTag = searchParams.get('tag');

  const [pinnedTags, setPinnedTags] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('notsen_pinned_tags');
    if (saved) setPinnedTags(JSON.parse(saved));
  }, []);

  const togglePin = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newPinned = pinnedTags.includes(tag) 
      ? pinnedTags.filter(t => t !== tag)
      : [...pinnedTags, tag];
    setPinnedTags(newPinned);
    localStorage.setItem('notsen_pinned_tags', JSON.stringify(newPinned));
  };

  const allTags = useMemo(() => {
    if (!notes) return [];
    const tags = new Set<string>();
    notes.forEach(note => {
      note.tags.forEach(t => tags.add(t));
    });
    return Array.from(tags).sort();
  }, [notes]);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader} style={{ marginTop: '0.5rem' }}>
        <span>Hızlı Notlar</span>
      </div>

      <nav className={styles.sidebarNav}>
        <button 
          className={`${styles.navItem} ${currentFilter === 'all' && !currentTag ? styles.navItemActive : ''}`}
          onClick={() => router.push('/notes')}
        >
          <Inbox size={16} /> Tüm Notlar
        </button>
        <button 
          className={`${styles.navItem} ${currentFilter === 'today' ? styles.navItemActive : ''}`}
          onClick={() => router.push('/notes?filter=today')}
        >
          <Clock size={16} /> Bugün
        </button>
        <button 
          className={`${styles.navItem} ${currentFilter === 'yesterday' ? styles.navItemActive : ''}`}
          onClick={() => router.push('/notes?filter=yesterday')}
        >
          <Clock size={16} /> Dün
        </button>
        <button 
          className={`${styles.navItem} ${currentFilter === 'week' ? styles.navItemActive : ''}`}
          onClick={() => router.push('/notes?filter=week')}
        >
          <Clock size={16} /> Bu Hafta
        </button>
      </nav>

      <div className={styles.sidebarHeader} style={{ marginTop: '1rem', borderTop: '1px solid var(--glass-border-subtle)', paddingTop: '1rem' }}>
        <span>Favori Etiketler</span>
      </div>
      <nav className={styles.sidebarNav}>
        {pinnedTags.length === 0 ? (
          <div style={{ padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Henüz favori etiket yok. Etiketleri yıldızlayın.
          </div>
        ) : (
          pinnedTags.map(tag => (
            <button 
              key={tag}
              className={`${styles.navItem} ${currentTag === tag ? styles.navItemActive : ''}`}
              onClick={() => router.push(`/notes?tag=${encodeURIComponent(tag)}`)}
              style={{ justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Hash size={14} /> {tag}
              </div>
              <Star 
                size={14} 
                fill="var(--accent-primary)" 
                color="var(--accent-primary)" 
                onClick={(e) => togglePin(tag, e)} 
              />
            </button>
          ))
        )}
      </nav>

      <div className={styles.sidebarHeader} style={{ marginTop: '1rem', borderTop: '1px solid var(--glass-border-subtle)', paddingTop: '1rem' }}>
        <span>Tüm Etiketler</span>
      </div>
      <nav className={styles.sidebarNav}>
        {allTags.filter(t => !pinnedTags.includes(t)).map(tag => (
          <button 
            key={tag}
            className={`${styles.navItem} ${currentTag === tag ? styles.navItemActive : ''}`}
            onClick={() => router.push(`/notes?tag=${encodeURIComponent(tag)}`)}
            style={{ justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Hash size={14} /> {tag}
            </div>
            <Star 
              size={14} 
              color="var(--text-muted)" 
              onClick={(e) => togglePin(tag, e)} 
            />
          </button>
        ))}
      </nav>
    </aside>
  );
}
