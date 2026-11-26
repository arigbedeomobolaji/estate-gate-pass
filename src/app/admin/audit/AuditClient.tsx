'use client';
import { useState } from 'react';
import Badge from '@/components/ui/Badge';

type LogRow = {
  id: string; action: string; targetType: string; targetId: string;
  createdAt: string; metadata?: any;
  user?: { fullName: string; role: string } | null;
  guard?: { user: { fullName: string } } | null;
};

const ACTIONS = [
  'CREATE_PERMIT', 'CANCEL_PERMIT', 'GRANT_ENTRY', 'DENY_ENTRY', 'RECORD_EXIT',
  'CREATE_USER', 'BULK_CREATE_USERS', 'DEACTIVATE_USER', 'CHANGE_PASSWORD',
  'CREATE_GATE', 'UPDATE_GATE', 'CREATE_GUARD', 'UPDATE_GUARD',
];

const selectCls = 'h-9 rounded-lg px-3 text-sm outline-none bg-white';
const selectStyle = { border: '1px solid var(--input)' };

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
      <div className="rounded-2xl bg-white shadow-sm p-5" style={{ border: '1px solid var(--border)' }}>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-1.5 block">Filter by action</label>
            <select className={selectCls} style={selectStyle} value={action} onChange={e => { setAction(e.target.value); load(1, e.target.value); }}>
              <option value="">All actions</option>
              {ACTIONS.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-semibold text-base m-0">Events ({data.total})</h2>
          {data.pages > 1 && (
            <div className="flex items-center gap-3">
              <button className="h-7 px-3 rounded-lg text-xs font-medium transition-colors" style={{ border: '1px solid var(--border)', background: 'white' }} disabled={busy || page <= 1} onClick={() => load(page - 1)}>← Prev</button>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Page {page} of {data.pages}</span>
              <button className="h-7 px-3 rounded-lg text-xs font-medium transition-colors" style={{ border: '1px solid var(--border)', background: 'white' }} disabled={busy || page >= data.pages} onClick={() => load(page + 1)}>Next →</button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Action', 'Actor', 'Target', 'Time'].map(h => (
                  <th key={h} className="h-10 px-5 text-left font-medium whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.logs.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>No events found.</td></tr>
              )}
              {data.logs.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-5 py-3 whitespace-nowrap"><Badge status={l.action} label={l.action.replace(/_/g, ' ')} /></td>
                  <td className="px-5 py-3 whitespace-nowrap font-medium">{l.user?.fullName || l.guard?.user?.fullName || 'System'}</td>
                  <td className="px-5 py-3 whitespace-nowrap font-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>{l.targetType} · {l.targetId.slice(0, 12)}…</td>
                  <td className="px-5 py-3 whitespace-nowrap text-xs" style={{ color: 'var(--muted-foreground)' }}>{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
