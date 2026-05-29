'use client';

import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800 antialiased">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Contents Panel */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Top Navbar Header */}
        <Navbar />

        {/* Dynamic Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-6 md:p-8 bg-[#f4f5f7]">
          {children}
        </main>
      </div>
    </div>
  );
}
