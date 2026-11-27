'use client';
import { useState } from 'react';
import Badge from '@/components/ui/Badge';
import { Search, X, Download } from 'lucide-react';

type PermitRow = {
  id: string; permitNumber: string; status: string; permitCategory?: string;
  purpose: string; visitDate: string; visitEndDate?: string; chargeAmount?: number;
  visitor: { fullName: string; phone: string };
  resident: { fullName: string; houseNumber: string };
  visit?: { status: string; entryAt?: string; exitAt?: string; entryGate?: { name: string } } | null;
};

const inputCls = 'h-9 w-full rounded-lg px-3 text-sm outline-none bg-white';
const inputStyle = { border: '1px solid var(--input)' };

export default function PermitsClient({ initial }: { initial: { permits: PermitRow[]; total: number; pages: number } }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function search(p = 1) {
    setBusy(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    params.set('page', String(p));
    const res = await fetch(`/api/admin/permits?${params}`);
    const d = await res.json();
    setBusy(false);
    setData(d);
    setPage(p);
  }

  function clear() {
    setQ(''); setStatus(''); setDateFrom(''); setDateTo('');
    setTimeout(() => search(1), 0);
  }

  function exportCsv() {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);
    window.location.href = `/api/admin/export/permits?${params}`;
  }

  return (
    <div className="max-w-6xl flex flex-col gap-5">
      {/* Filters */}
      <div className="rounded-2xl bg-white shadow-sm p-5" style={{ border: '1px solid var(--border)' }}>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Search</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
                <input
                  className={inputCls}
                  style={{ ...inputStyle, paddingLeft: '2rem' }}
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && search(1)}
                  placeholder="Visitor, resident, house, permit no., vehicle…"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Permit status</label>
              <select className={inputCls} style={inputStyle} value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">All statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Visit date from</label>
              <input type="date" className={inputCls} style={inputStyle} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Visit date to</label>
              <input type="date" className={inputCls} style={inputStyle} value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => search(1)} disabled={busy} className="h-9 px-4 rounded-lg text-sm font-medium text-white disabled:opacity-60" style={{ background: 'var(--sidebar)' }}>
              {busy ? 'Searching…' : 'Search'}
            </button>
            <button onClick={clear} className="h-9 px-4 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors" style={{ border: '1px solid var(--border)', background: 'white' }}>
              <X size={13} /> Clear
            </button>
            <button onClick={exportCsv} className="h-9 px-4 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ml-auto" style={{ border: '1px solid var(--border)', background: 'white' }}>
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-semibold text-base m-0">Results ({data.total})</h2>
          {data.pages > 1 && (
            <div className="flex items-center gap-3">
              <button className="h-7 px-3 rounded-lg text-xs font-medium transition-colors" style={{ border: '1px solid var(--border)', background: 'white' }} disabled={page <= 1} onClick={() => search(page - 1)}>← Prev</button>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Page {page} of {data.pages}</span>
              <button className="h-7 px-3 rounded-lg text-xs font-medium transition-colors" style={{ border: '1px solid var(--border)', background: 'white' }} disabled={page >= data.pages} onClick={() => search(page + 1)}>Next →</button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Permit', 'Visitor', 'Resident / House', 'Date', 'Visit status', 'Permit status'].map(h => (
                  <th key={h} className="h-10 px-4 text-left font-medium whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.permits.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>No permits found.</td></tr>
              )}
              {data.permits.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-mono text-xs font-semibold">{p.permitNumber}</div>
                    {p.permitCategory && <div className="mt-0.5"><Badge status={p.permitCategory} /></div>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-medium">{p.visitor.fullName}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{p.visitor.phone}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-medium">{p.resident.fullName}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{p.resident.houseNumber}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    {p.visitDate}{p.visitEndDate ? ` – ${p.visitEndDate}` : ''}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge status={p.visit?.status ?? 'EXPECTED'} />
                    {p.visit?.entryGate?.name && <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{p.visit.entryGate.name}</div>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap"><Badge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
