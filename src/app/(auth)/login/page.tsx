import { Suspense } from 'react';
import Login from '@/components/Auth/Login';

export default function LoginPage() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}
