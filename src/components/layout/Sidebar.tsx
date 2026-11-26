'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Home, FileText, Plus, ScanLine, Users, DoorOpen, ClipboardList, Settings, LogOut, X } from 'lucide-react';
import type { User } from '@/lib/types';

type NavItem = { href: string; label: string; icon: React.ReactNode };

function getNavItems(role: string): { section: string; items: NavItem[] }[] {
  if (role === 'RESIDENT') return [{
    section: 'Resident',
    items: [
      { href: '/resident', label: 'Dashboard', icon: <Home size={16} /> },
      { href: '/resident/permits', label: 'My Permits', icon: <FileText size={16} /> },
      { href: '/resident/permits/new', label: 'New Permit', icon: <Plus size={16} /> },
    ],
  }];
  if (role === 'GUARD') return [{
    section: 'Security',
    items: [
      { href: '/guard', label: 'Gate Verification', icon: <ScanLine size={16} /> },
    ],
  }];
  return [{
    section: 'Administration',
    items: [
      { href: '/admin', label: 'Dashboard', icon: <Home size={16} /> },
      { href: '/admin/users', label: 'Users & Accounts', icon: <Users size={16} /> },
      { href: '/admin/gates', label: 'Gates', icon: <DoorOpen size={16} /> },
      { href: '/admin/permits', label: 'Permit Monitoring', icon: <FileText size={16} /> },
      { href: '/admin/audit', label: 'Audit Log', icon: <ClipboardList size={16} /> },
      { href: '/admin/rules', label: 'Permit Rules', icon: <Settings size={16} /> },
    ],
  }];
}

interface SidebarProps {
  user: User;
  open?: boolean;
  onClose?: () => void;
}

function SidebarContent({ user, onClose }: { user: User; onClose?: () => void }) {
  const pathname = usePathname();
  const groups = getNavItems(user.role);
  const initials = user.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <aside className="flex flex-col w-64 h-full shrink-0" style={{ background: 'var(--sidebar)', color: 'var(--sidebar-foreground)' }}>
      {/* Brand */}
      <div className="flex items-center justify-between px-5 h-14 shrink-0" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'oklch(1 0 0 / 0.12)' }}>
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm tracking-wide leading-tight">Estate Access</div>
            <div className="text-[10px] leading-tight" style={{ color: 'oklch(1 0 0 / 0.35)' }}>NAF Base Control</div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 rounded-lg" style={{ color: 'oklch(1 0 0 / 0.5)' }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {groups.map(group => (
          <div key={group.section} className="mb-4">
            <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'oklch(1 0 0 / 0.28)' }}>
              {group.section}
            </div>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const exact = item.href === '/admin' || item.href === '/resident' || item.href === '/guard';
                const active = exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150"
                    style={active
                      ? { background: 'white', color: 'var(--sidebar)', fontWeight: 600 }
                      : { color: 'oklch(1 0 0 / 0.6)' }
                    }
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="shrink-0 p-4" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-white" style={{ background: 'oklch(1 0 0 / 0.15)' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{user.fullName}</div>
            <div className="text-[11px] truncate" style={{ color: 'oklch(1 0 0 / 0.4)' }}>{user.role}</div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="p-1.5 rounded-lg transition-colors" style={{ color: 'oklch(1 0 0 / 0.45)' }} title="Sign out">
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

export default function Sidebar({ user, open = false, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex h-full">
        <SidebarContent user={user} />
      </div>
      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <div className="relative z-10 flex h-full">
            <SidebarContent user={user} onClose={onClose} />
          </div>
        </div>
      )}
    </>
  );
}
