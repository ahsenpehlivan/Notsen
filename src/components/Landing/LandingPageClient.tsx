"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from '@/components/Landing/LandingPage';

export default function LandingPageClient() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      if (code) {
        const next = url.searchParams.get('next') ?? '/boards';
        window.location.href = `/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`;
      }
    }
  }, []);

  return (
    <LandingPage onGetStarted={() => router.push('/login')} />
  );
}
