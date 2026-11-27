'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, CheckCheck } from 'lucide-react';

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationsClient() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch('/api/notifications');
    if (r.ok) {
      const d = await r.json();
      setNotifications(d.notifications ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function markAllRead() {
    setMarking(true);
    const r = await fetch('/api/notifications/read-all', { method: 'PATCH' });
    setMarking(false);
    if (r.ok) {
      setNotifications(prev => prev.map(n => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
      toast.success('All notifications marked as read');
    } else {
      toast.error('Failed to mark notifications as read');
    }
  }

  async function markOneRead(id: string) {
    const r = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    if (r.ok) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
    }
  }

  const unreadCount = notifications.filter(n => !n.readAt).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Loading notifications…
      </div>
    );
  }

  return (
    <div className="max-w-2xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        </span>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={marking}>
            <CheckCheck size={14} /> {marking ? 'Marking…' : 'Mark all as read'}
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell size={32} className="mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No notifications yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {notifications.map(n => (
              <button
                key={n.id}
                onClick={() => !n.readAt && markOneRead(n.id)}
                className="w-full text-left px-5 py-4 flex items-start gap-3 transition-colors hover:bg-muted/40"
                style={{ cursor: n.readAt ? 'default' : 'pointer' }}
              >
                {/* Unread indicator */}
                <div className="mt-1.5 shrink-0 w-2 h-2 rounded-full" style={{ background: n.readAt ? 'transparent' : 'oklch(0.55 0.2 250)' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm">{n.title}</span>
                    <span className="text-xs shrink-0" style={{ color: 'var(--muted-foreground)' }}>{relativeTime(n.createdAt)}</span>
                  </div>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{n.message}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
