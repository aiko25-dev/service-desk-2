'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/tickets');
  }, [router]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-50 text-slate-400 font-semibold text-xs">
      Бағытталуда...
    </div>
  );
}
