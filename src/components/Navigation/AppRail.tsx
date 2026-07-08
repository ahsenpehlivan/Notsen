'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Calendar, Settings, UserCircle } from 'lucide-react';
import styles from './Navigation.module.css';

export default function AppRail() {
  const router = useRouter();
  const pathname = usePathname();

  const isNotesMode = pathname.startsWith('/notes');
  const isKanbanMode = !isNotesMode && !pathname.startsWith('/profile') && !pathname.startsWith('/settings');

  return (
    <aside className={styles.appRail}>
      <div className={styles.railLogo}>
        <Image src="/icon.png" alt="Notsen Logo" width={36} height={36} />
      </div>

      <div className={styles.railItems}>
        <button 
          className={`${styles.railBtn} ${isKanbanMode ? styles.railBtnActive : ''}`}
          onClick={() => router.push('/boards')}
          title="Panolar (İş Yönetimi)"
        >
          <LayoutDashboard size={22} />
        </button>

        <button 
          className={`${styles.railBtn} ${isNotesMode ? styles.railBtnActive : ''}`}
          onClick={() => router.push('/notes')}
          title="Hızlı Notlar"
        >
          <MessageSquare size={22} />
        </button>
        
        <button 
          className={`${styles.railBtn} ${pathname.startsWith('/calendar') ? styles.railBtnActive : ''}`}
          onClick={() => router.push('/calendar')}
          title="Takvim"
        >
          <Calendar size={22} />
        </button>
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button 
          className={`${styles.railBtn} ${pathname.startsWith('/profile') ? styles.railBtnActive : ''}`}
          onClick={() => router.push('/profile')}
          title="Profil"
        >
          <UserCircle size={22} />
        </button>
      </div>
    </aside>
  );
}
