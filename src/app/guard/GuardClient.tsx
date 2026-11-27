'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import QrScanner from './QrScanner';
import Badge from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  CheckCircle, XCircle, AlertCircle, ScanLine, DoorOpen,
  LogIn, LogOut, UserCheck, Users, Clock, Search, WifiOff,
} from 'lucide-react';

type Gate = { id: string; name: string };
type VerifyResult = {
  ok: boolean;
  code: string;
  _cached?: boolean;
  _cacheAgeSeconds?: number;
  permit?: {
    id: string;
    permitNumber: string;
    purpose: string;
    visitDate: string;
    visitEndDate?: string | null;
    startTime: string;
    endTime: string;
    vehicleRegistration?: string | null;
    vehicleType?: string | null;
    visitorPhotoUrl?: string | null;
    visitor: { fullName: string; phone: string };
    resident: { fullName: string; houseNumber: string };
    visit?: { status: string; entryAt?: string | null; exitAt?: string | null } | null;
  };
};

type SearchResult = {
  id: string;
  permitNumber: string;
  visitDate: string;
  status: string;
  visitor: { fullName: string };
  resident: { fullName: string; houseNumber: string };
};

type GuardStats = { insideCount: number; expectedCount: number; entriesToday: number };

const CODE_CONFIG: Record<string, { label: string; icon: React.ReactNode; variant: 'valid' | 'invalid' | 'warn' }> = {
  VALID:         { label: 'VALID PERMIT',      icon: <CheckCircle size={20} />, variant: 'valid' },
  NOT_YET_VALID: { label: 'NOT YET VALID',     icon: <AlertCircle size={20} />, variant: 'warn' },
  EXPIRED:       { label: 'PERMIT EXPIRED',    icon: <XCircle size={20} />,    variant: 'invalid' },
  CANCELLED:     { label: 'PERMIT CANCELLED',  icon: <XCircle size={20} />,    variant: 'invalid' },
  ALREADY_USED:  { label: 'ALREADY USED',      icon: <AlertCircle size={20} />, variant: 'warn' },
  NOT_FOUND:     { label: 'PERMIT NOT FOUND',  icon: <XCircle size={20} />,    variant: 'invalid' },
  OFFLINE:       { label: 'NO CONNECTION',     icon: <WifiOff size={20} />,    variant: 'warn' },
};

const VARIANT_STYLES = {
  valid:   { bg: 'oklch(0.52 0.15 145 / 0.07)',   border: 'oklch(0.52 0.15 145 / 0.3)',   color: 'oklch(0.32 0.12 145)' },
  invalid: { bg: 'oklch(0.577 0.245 27.325 / 0.07)', border: 'oklch(0.577 0.245 27.325 / 0.3)', color: 'oklch(0.42 0.18 27)' },
  warn:    { bg: 'oklch(0.69 0.155 73 / 0.07)',   border: 'oklch(0.69 0.155 73 / 0.3)',   color: 'oklch(0.46 0.14 73)' },
};

export default function GuardClient({ assignedGateId, guardName }: { assignedGateId: string | null; guardName: string }) {
  const [token, setToken] = useState('');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [gates, setGates] = useState<Gate[]>([]);
  const [gateId, setGateId] = useState('');

  // Stats
  const [stats, setStats] = useState<GuardStats | null>(null);

  // Deny dialog
  const [denyOpen, setDenyOpen] = useState(false);
  const [denyReason, setDenyReason] = useState('');
  const [denyBusy, setDenyBusy] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchError, setSearchError] = useState('');

  async function loadStats() {
    try {
      const r = await fetch('/api/guard/stats');
      if (r.ok) setStats(await r.json());
    } catch {
      // non-blocking
    }
  }

  useEffect(() => {
    fetch('/api/gates').then(r => r.json()).then(d => {
      const list: Gate[] = d.gates ?? [];
      setGates(list);
      const preferred = assignedGateId ? list.find(g => g.id === assignedGateId) : null;
      setGateId(preferred?.id ?? list[0]?.id ?? '');
    });
    loadStats();
  }, [assignedGateId]);

  async function verifyToken(value: string) {
    setResult(null);
    try {
      const r = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: value }),
      });
      setResult(await r.json());
    } catch {
      setResult({ ok: false, code: 'OFFLINE' });
    }
  }

  async function entry() {
    const r = await fetch('/api/visits/entry', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ permitId: result!.permit!.id, token, gateId }),
    });
    const d = await r.json();
    if (!r.ok || d.ok === false) { toast.error(d.error || 'Entry denied'); return; }
    toast.success('Entry granted — resident notified');
    verifyToken(token);
    loadStats();
  }

  async function exit() {
    const r = await fetch('/api/visits/exit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ permitId: result!.permit!.id, gateId }),
    });
    const d = await r.json();
    if (r.ok && d.ok) toast.success('Exit recorded');
    else toast.error(d.error || 'Unable to record exit');
    verifyToken(token);
    loadStats();
  }

  async function confirmDeny() {
    if (!result?.permit) return;
    if (denyReason.trim().length < 5) {
      toast.error('Please provide a reason (at least 5 characters)');
      return;
    }
    setDenyBusy(true);
    const r = await fetch('/api/visits/deny', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ permitId: result.permit.id, gateId, reason: denyReason.trim() }),
    });
    const d = await r.json();
    setDenyBusy(false);
    if (r.ok && d.ok) {
      toast.success('Entry denied — reason recorded');
      setDenyOpen(false);
      setDenyReason('');
      verifyToken(token);
      loadStats();
    } else {
      toast.error(d.error || 'Failed to record denial');
    }
  }

  async function doSearch() {
    setSearchError('');
    if (searchQuery.trim().length < 2) {
      setSearchError('Enter at least 2 characters to search');
      return;
    }
    setSearchBusy(true);
    const r = await fetch(`/api/permits/search?q=${encodeURIComponent(searchQuery.trim())}`);
    const d = await r.json();
    setSearchBusy(false);
    if (!r.ok) {
      setSearchError(d.error || 'Search failed');
      return;
    }
    setSearchResults(d.permits ?? []);
    if ((d.permits ?? []).length === 0) setSearchError('No permits found');
  }

  function pickSearchResult(r: SearchResult) {
    setToken(r.permitNumber);
    verifyToken(r.permitNumber);
    setSearchResults([]);
    setSearchQuery('');
  }

  const selectedGateName = gates.find(g => g.id === gateId)?.name ?? '—';
  const p = result?.permit;
  const cfg = result ? (CODE_CONFIG[result.code] ?? { label: result.code, icon: <AlertCircle size={20} />, variant: 'warn' as const }) : null;
  const vstyle = cfg ? VARIANT_STYLES[cfg.variant] : null;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      {/* Stats — 4 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <DoorOpen size={16} style={{ color: 'var(--muted-foreground)' }} />
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Gate</span>
            </div>
            <div className="text-xl font-extrabold" style={{ color: 'var(--afit-navy)' }}>{selectedGateName}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{guardName}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck size={16} style={{ color: 'oklch(0.52 0.15 145)' }} />
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Inside</span>
            </div>
            <div className="text-xl font-extrabold" style={{ color: 'oklch(0.42 0.14 145)' }}>
              {stats ? stats.insideCount : '—'}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Currently inside</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} style={{ color: 'var(--muted-foreground)' }} />
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Expected</span>
            </div>
            <div className="text-xl font-extrabold" style={{ color: 'var(--afit-navy)' }}>
              {stats ? stats.expectedCount : '—'}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Expected today</div>
          </CardContent>
        </Card>

        <div className="afit-gradient-hero rounded-2xl p-5 shadow-sm" style={{ border: '1px solid oklch(1 0 0 / 0.12)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} style={{ color: 'oklch(1 0 0 / 0.6)' }} />
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'oklch(1 0 0 / 0.5)' }}>Entries</span>
          </div>
          <div className="text-xl font-extrabold text-white">
            {stats ? stats.entriesToday : '—'}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'oklch(1 0 0 / 0.5)' }}>Entries today</div>
        </div>
      </div>

      {/* Verification panel */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Gate Verification</CardTitle>
            <p className="text-sm mt-0.5 m-0" style={{ color: 'var(--muted-foreground)' }}>Scan a QR code or enter a permit number manually.</p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <QrScanner onToken={v => { setToken(v); verifyToken(v); }} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Gate</Label>
              <Select value={gateId} onChange={e => setGateId(e.target.value)}>
                {gates.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </Select>
            </div>
            <div>
              <Label>Permit No. or QR token</Label>
              <Input value={token} onChange={e => setToken(e.target.value)} placeholder="EST-20260929-A82KF" />
            </div>
          </div>

          <Button variant="navy" onClick={() => verifyToken(token)} className="self-start">
            <ScanLine size={15} /> Verify permit
          </Button>
        </CardContent>
      </Card>

      {/* Result */}
      {result && cfg && vstyle && (
        <div className="rounded-2xl p-5" style={{ background: vstyle.bg, border: `1px solid ${vstyle.border}` }}>
          <div className="flex items-center gap-2 mb-4" style={{ color: vstyle.color }}>
            {cfg.icon}
            <span className="font-extrabold text-base tracking-tight">{cfg.label}</span>
            {result._cached && (
              <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'oklch(0.69 0.155 73 / 0.15)', color: 'oklch(0.46 0.14 73)' }}>
                CACHED
              </span>
            )}
          </div>

          {result._cached && (
            <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 mb-4 text-sm" style={{ background: 'oklch(0.69 0.155 73 / 0.08)', border: '1px solid oklch(0.69 0.155 73 / 0.25)', color: 'oklch(0.44 0.13 73)' }}>
              <WifiOff size={15} className="shrink-0 mt-0.5" />
              <span>
                <strong>No network.</strong> Showing cached result from {Math.round((result._cacheAgeSeconds ?? 0) / 60) < 1 ? 'less than a minute' : `${Math.round((result._cacheAgeSeconds ?? 0) / 60)} min`} ago.
                Entry and exit cannot be recorded until the connection is restored.
              </span>
            </div>
          )}

          {p && (
            <>
              <div className="flex items-start gap-4 mb-5">
                {p.visitorPhotoUrl && (
                  <img
                    src={p.visitorPhotoUrl}
                    alt={`Photo of ${p.visitor.fullName}`}
                    className="w-20 h-20 rounded-xl object-cover shrink-0"
                    style={{ border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                  />
                )}
                <div>
                  <div className="text-xl font-extrabold tracking-tight">{p.visitor.fullName}</div>
                  <div className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{p.visitor.phone}</div>
                  <div className="text-sm mt-2">
                    Visiting <strong>{p.resident.fullName}</strong> · House {p.resident.houseNumber}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm mb-5">
                {[
                  ['Purpose', p.purpose],
                  ['Dates', p.visitEndDate ? `${p.visitDate} – ${p.visitEndDate}` : p.visitDate],
                  ['Time', `${p.startTime}–${p.endTime}`],
                  ['Vehicle', p.vehicleRegistration || 'Not specified'],
                  ['Permit No.', p.permitNumber],
                ].map(([lbl, val]) => (
                  <div key={lbl}>
                    <div className="text-[11px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--muted-foreground)' }}>{lbl}</div>
                    <div className="font-semibold">{val}</div>
                  </div>
                ))}
              </div>

              {p.visit && <div className="mb-4"><Badge status={p.visit.status} /></div>}

              <div className="flex gap-3 flex-wrap">
                {result.ok && !result._cached && (
                  <>
                    <Button variant="navy" onClick={entry}>
                      <LogIn size={15} /> Grant entry
                    </Button>
                    <Button variant="destructive" onClick={() => setDenyOpen(true)}>
                      <XCircle size={15} /> Deny entry
                    </Button>
                  </>
                )}
                {!result.ok && p.visit?.status === 'INSIDE' && !result._cached && (
                  <Button variant="navy" onClick={exit}>
                    <LogOut size={15} /> Mark exit
                  </Button>
                )}
                {result._cached && (
                  <p className="text-xs font-semibold" style={{ color: 'oklch(0.46 0.14 73)' }}>
                    <WifiOff size={12} className="inline mr-1" />
                    Reconnect to record entry or exit
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Search by name */}
      <Card>
        <CardHeader>
          <CardTitle>Search by name</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div>
            <Label>Search visitor / resident / house</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSearchError(''); }}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
                placeholder="e.g. John Doe, House B12…"
              />
              <Button variant="navy" onClick={doSearch} disabled={searchBusy}>
                <Search size={14} /> {searchBusy ? 'Searching…' : 'Search'}
              </Button>
            </div>
            {searchError && (
              <p className="text-xs mt-1.5" style={{ color: 'oklch(0.42 0.18 27)' }}>{searchError}</p>
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {searchResults.map(r => (
                <button
                  key={r.id}
                  onClick={() => pickSearchResult(r)}
                  className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors hover:bg-muted/50"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <div>
                    <div className="font-semibold text-sm">{r.visitor.fullName}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                      {r.resident.fullName} · House {r.resident.houseNumber}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-xs font-bold" style={{ color: 'var(--afit-navy)' }}>{r.permitNumber}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{r.visitDate}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deny Entry Dialog */}
      <Dialog open={denyOpen} onOpenChange={open => { setDenyOpen(open); if (!open) setDenyReason(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deny Entry</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Provide a reason for denying entry to <strong>{p?.visitor.fullName}</strong>.
            </p>
            <div>
              <Label>Reason for denial</Label>
              <textarea
                value={denyReason}
                onChange={e => setDenyReason(e.target.value)}
                placeholder="Reason for denial…"
                className="w-full rounded-lg border px-3 py-2 text-sm mt-1"
                style={{ borderColor: 'var(--border)', minHeight: '90px', resize: 'vertical' }}
                minLength={5}
              />
              {denyReason.length > 0 && denyReason.trim().length < 5 && (
                <p className="text-xs mt-1" style={{ color: 'oklch(0.42 0.18 27)' }}>Reason must be at least 5 characters.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDenyOpen(false)} disabled={denyBusy}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeny}
              disabled={denyBusy || denyReason.trim().length < 5}
            >
              {denyBusy ? 'Recording…' : 'Confirm denial'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
