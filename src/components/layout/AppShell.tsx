'use client';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import type { User } from '@/lib/types';

interface AppShellProps {
  user: User;
  title?: string;
  children: React.ReactNode;
}

export default function AppShell({ user, title = 'NAF Base Access Control', children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--background)' }}>
      <Sidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar title={title} onMenuClick={() => setSidebarOpen(true)} user={user} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
