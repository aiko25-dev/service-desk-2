'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AppLayout from '../components/layout/AppLayout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const isLoginRoute = pathname === '/login';
    if (!isAuthenticated && !isLoginRoute) {
      router.replace('/login');
    } else if (isAuthenticated && isLoginRoute) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, pathname, router, mounted]);

  // Prevent server-side rendering mismatch for localStorage checks
  if (!mounted) {
    return <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-slate-400">Загрузка Service Desk...</div>;
  }

  const isLoginRoute = pathname === '/login';

  return (
    <QueryClientProvider client={queryClient}>
      {isAuthenticated && !isLoginRoute ? (
        <AppLayout>{children}</AppLayout>
      ) : (
        <div className="min-h-screen w-screen flex flex-col bg-slate-950">
          {children}
        </div>
      )}
    </QueryClientProvider>
  );
}
