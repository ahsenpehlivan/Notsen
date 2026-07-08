'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Calendar, UserCircle } from 'lucide-react';
import styles from './Navigation.module.css';

export default function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className={styles.bottomTabBar}>
      <div className={styles.tabBarContainer}>
        <button 
          className={`${styles.tabBtn} ${(pathname.startsWith('/boards') || pathname.startsWith('/tasks')) ? styles.tabBtnActive : ''}`}
          onClick={() => router.push('/boards')}
        >
          <div className={styles.tabBtnIcon}><LayoutDashboard size={20} /></div>
          <span>Panolar</span>
        </button>

        <button 
          className={`${styles.tabBtn} ${pathname.startsWith('/notes') ? styles.tabBtnActive : ''}`}
          onClick={() => router.push('/notes')}
        >
          <div className={styles.tabBtnIcon}><MessageSquare size={20} /></div>
          <span>Notlar</span>
        </button>

        <button 
          className={`${styles.tabBtn} ${pathname.startsWith('/calendar') ? styles.tabBtnActive : ''}`}
          onClick={() => router.push('/calendar')}
        >
          <div className={styles.tabBtnIcon}><Calendar size={20} /></div>
          <span>Takvim</span>
        </button>

        <button 
          className={`${styles.tabBtn} ${pathname.startsWith('/profile') ? styles.tabBtnActive : ''}`}
          onClick={() => router.push('/profile')}
        >
          <div className={styles.tabBtnIcon}><UserCircle size={20} /></div>
          <span>Profil</span>
        </button>
      </div>
    </nav>
  );
}
