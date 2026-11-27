'use client';
import { useState } from 'react';
import Badge from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, ChevronLeft, ChevronRight } from 'lucide-react';

type LogRow = {
  id: string; action: string; targetType: string; targetId: string;
  createdAt: string; metadata?: unknown;
  user?: { fullName: string; role: string } | null;
  guard?: { user: { fullName: string } } | null;
};

const ACTIONS = [
  'CREATE_PERMIT', 'CANCEL_PERMIT', 'GRANT_ENTRY', 'DENY_ENTRY', 'RECORD_EXIT',
  'CREATE_USER', 'BULK_CREATE_USERS', 'DEACTIVATE_USER', 'CHANGE_PASSWORD',
  'CREATE_GATE', 'UPDATE_GATE', 'CREATE_GUARD', 'UPDATE_GUARD',
];

export default function AuditClient({ initial }: { initial: { logs: LogRow[]; total: number; page: number; pages: number } }) {
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function load(p = 1, a = action) {
    setBusy(true);
    const params = new URLSearchParams({ page: String(p), ...(a && { action: a }) });
    const res = await fetch(`/api/admin/audit?${params}`);
    const d = await res.json();
    setBusy(false);
    setData(d);
    setPage(p);
  }

  return (
    <div className="max-w-5xl flex flex-col gap-5">
      {/* Filter */}
      <Card>
        <div className="p-5 flex items-end gap-4 flex-wrap">
          <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-1 max-w-xs">
            <div>
              <Label className="flex items-center gap-1.5">
                <Filter size={13} /> Filter by action
              </Label>
              <Select
                value={action}
                onChange={e => { setAction(e.target.value); load(1, e.target.value); }}
              >
                <option value="">All actions</option>
                {ACTIONS.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Events ({data.total})</CardTitle>
          {data.pages > 1 && (
            <div className="flex items-center gap-2">
              <Button size="icon-sm" variant="outline" disabled={busy || page <= 1} onClick={() => load(page - 1)}>
                <ChevronLeft size={14} />
              </Button>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Page {page} of {data.pages}</span>
              <Button size="icon-sm" variant="outline" disabled={busy || page >= data.pages} onClick={() => load(page + 1)}>
                <ChevronRight size={14} />
              </Button>
            </div>
          )}
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="afit-gradient-soft">
                {['Action', 'Actor', 'Target', 'Time'].map(h => (
                  <th key={h} className="h-10 px-5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--afit-navy)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.logs.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>No events found.</td></tr>
              )}
              {data.logs.map(l => (
                <tr key={l.id} className="hover:bg-muted/40 transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-5 py-3 whitespace-nowrap"><Badge status={l.action} label={l.action.replace(/_/g, ' ')} /></td>
                  <td className="px-5 py-3 whitespace-nowrap font-semibold">{l.user?.fullName || l.guard?.user?.fullName || 'System'}</td>
                  <td className="px-5 py-3 whitespace-nowrap font-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>{l.targetType} · {l.targetId.slice(0, 12)}…</td>
                  <td className="px-5 py-3 whitespace-nowrap text-xs" style={{ color: 'var(--muted-foreground)' }}>{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
