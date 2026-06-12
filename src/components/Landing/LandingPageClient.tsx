"use client";

import { useRouter } from 'next/navigation';
import LandingPage from '@/components/Landing/LandingPage';

export default function LandingPageClient() {
  const router = useRouter();

  return (
    <LandingPage onGetStarted={() => router.push('/login')} />
  );
}
