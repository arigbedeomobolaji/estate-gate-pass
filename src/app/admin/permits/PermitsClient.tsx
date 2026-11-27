'use client';
import { useState } from 'react';
import Badge from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, X, Download, ChevronLeft, ChevronRight } from 'lucide-react';

type PermitRow = {
  id: string; permitNumber: string; status: string; permitCategory?: string;
  purpose: string; visitDate: string; visitEndDate?: string; chargeAmount?: number;
  visitor: { fullName: string; phone: string };
  resident: { fullName: string; houseNumber: string };
  visit?: { status: string; entryAt?: string; exitAt?: string; entryGate?: { name: string } } | null;
};

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
      <Card>
        <div className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted-foreground)' }} />
                <Input
                  className="pl-9"
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && search(1)}
                  placeholder="Visitor, resident, house, permit no., vehicle…"
                />
              </div>
            </div>
            <div>
              <Label>Permit status</Label>
              <Select value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">All statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Visit date from</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <Label>Visit date to</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button variant="navy" onClick={() => search(1)} disabled={busy}>
              <Search size={14} /> {busy ? 'Searching…' : 'Search'}
            </Button>
            <Button variant="outline" onClick={clear}>
              <X size={13} /> Clear
            </Button>
            <Button variant="outline" onClick={exportCsv} className="ml-auto">
              <Download size={13} /> Export CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Results ({data.total})</CardTitle>
          {data.pages > 1 && (
            <div className="flex items-center gap-2">
              <Button size="icon-sm" variant="outline" disabled={page <= 1} onClick={() => search(page - 1)}>
                <ChevronLeft size={14} />
              </Button>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Page {page} of {data.pages}</span>
              <Button size="icon-sm" variant="outline" disabled={page >= data.pages} onClick={() => search(page + 1)}>
                <ChevronRight size={14} />
              </Button>
            </div>
          )}
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="afit-gradient-soft">
                {['Permit', 'Visitor', 'Resident / House', 'Date', 'Visit status', 'Permit status'].map(h => (
                  <th key={h} className="h-10 px-4 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--afit-navy)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.permits.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>No permits found.</td></tr>
              )}
              {data.permits.map(p => (
                <tr key={p.id} className="hover:bg-muted/40 transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-mono text-xs font-bold">{p.permitNumber}</div>
                    {p.permitCategory && <div className="mt-0.5"><Badge status={p.permitCategory} /></div>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-semibold">{p.visitor.fullName}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{p.visitor.phone}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-semibold">{p.resident.fullName}</div>
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
      </Card>
    </div>
  );
}
