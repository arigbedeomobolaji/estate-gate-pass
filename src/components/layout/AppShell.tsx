'use client';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import type { User } from '@/lib/types';
import { WifiOff } from 'lucide-react';

interface AppShellProps {
  user: User;
  title?: string;
  children: React.ReactNode;
}

export default function AppShell({ user, title = 'NAF Base Access Control', children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const on  = () => setIsOffline(false);
    const off = () => setIsOffline(true);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--background)' }}>
      <Sidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 overflow-hidden">
        {isOffline && (
          <div className="flex items-center justify-center gap-2 py-1.5 px-4 text-xs font-semibold text-white" style={{ background: 'oklch(0.52 0.14 73)', flexShrink: 0 }}>
            <WifiOff size={12} />
            You are offline — cached pages are available but actions require a connection
          </div>
        )}
        <Topbar title={title} onMenuClick={() => setSidebarOpen(true)} user={user} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
