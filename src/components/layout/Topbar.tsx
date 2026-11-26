'use client';
import { Menu } from 'lucide-react';

interface TopbarProps {
  title: string;
  onMenuClick?: () => void;
}

export default function Topbar({ title, onMenuClick }: TopbarProps) {
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
      <span className="font-bold text-base tracking-tight text-white">{title}</span>
    </header>
  );
}
