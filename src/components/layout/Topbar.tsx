'use client';
import { useEffect, useState } from 'react';
import { Menu, Bell } from 'lucide-react';
import Link from 'next/link';
import type { User } from '@/lib/types';

interface TopbarProps {
  title: string;
  onMenuClick?: () => void;
  user?: User;
}

function NotificationBell() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(d => {
        const list: Array<{ readAt: string | null }> = d.notifications ?? [];
        setUnread(list.filter(n => !n.readAt).length);
      })
      .catch(() => {});
  }, []);

  return (
    <Link
      href="/resident/notifications"
      className="relative p-1.5 rounded-lg transition-colors hover:bg-white/10"
      style={{ color: 'oklch(1 0 0 / 0.8)' }}
      aria-label="Notifications"
    >
      <Bell size={20} />
      {unread > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-0.5"
          style={{ background: 'oklch(0.577 0.245 27.325)' }}
        >
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  );
}

export default function Topbar({ title, onMenuClick, user }: TopbarProps) {
  return (
    <header
      className="h-14 shrink-0 flex items-center gap-4 px-6 relative z-10"
      style={{ background: 'var(--sidebar)', borderBottom: '1px solid oklch(1 0 0 / 0.1)' }}
    >
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 rounded-lg transition-colors"
        style={{ color: 'oklch(1 0 0 / 0.7)' }}
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>
      <span className="font-bold text-base tracking-tight text-white flex-1">{title}</span>
      {user?.role === 'RESIDENT' && <NotificationBell />}
    </header>
  );
}
