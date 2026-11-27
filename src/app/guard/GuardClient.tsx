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
import { CheckCircle, XCircle, AlertCircle, ScanLine, DoorOpen, LogIn, LogOut } from 'lucide-react';

type Gate = { id: string; name: string };
type VerifyResult = {
  ok: boolean;
  code: string;
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

const CODE_CONFIG: Record<string, { label: string; icon: React.ReactNode; variant: 'valid' | 'invalid' | 'warn' }> = {
  VALID:         { label: 'VALID PERMIT',      icon: <CheckCircle size={20} />, variant: 'valid' },
  NOT_YET_VALID: { label: 'NOT YET VALID',     icon: <AlertCircle size={20} />, variant: 'warn' },
  EXPIRED:       { label: 'PERMIT EXPIRED',    icon: <XCircle size={20} />,    variant: 'invalid' },
  CANCELLED:     { label: 'PERMIT CANCELLED',  icon: <XCircle size={20} />,    variant: 'invalid' },
  ALREADY_USED:  { label: 'ALREADY USED',      icon: <AlertCircle size={20} />, variant: 'warn' },
  NOT_FOUND:     { label: 'PERMIT NOT FOUND',  icon: <XCircle size={20} />,    variant: 'invalid' },
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

  useEffect(() => {
    fetch('/api/gates').then(r => r.json()).then(d => {
      const list: Gate[] = d.gates ?? [];
      setGates(list);
      const preferred = assignedGateId ? list.find(g => g.id === assignedGateId) : null;
      setGateId(preferred?.id ?? list[0]?.id ?? '');
    });
  }, [assignedGateId]);

  async function verifyToken(value: string) {
    setResult(null);
    const r = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: value }),
    });
    setResult(await r.json());
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
  }

  const selectedGateName = gates.find(g => g.id === gateId)?.name ?? '—';
  const p = result?.permit;
  const cfg = result ? (CODE_CONFIG[result.code] ?? { label: result.code, icon: <AlertCircle size={20} />, variant: 'warn' as const }) : null;
  const vstyle = cfg ? VARIANT_STYLES[cfg.variant] : null;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
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
        <div className="afit-gradient-hero rounded-2xl p-5 shadow-sm" style={{ border: '1px solid oklch(1 0 0 / 0.12)' }}>
          <div className="flex items-center gap-2 mb-2">
            <ScanLine size={16} style={{ color: 'oklch(1 0 0 / 0.6)' }} />
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'oklch(1 0 0 / 0.5)' }}>Status</span>
          </div>
          <div className="text-xl font-extrabold text-white">Active</div>
          <div className="text-xs mt-0.5" style={{ color: 'oklch(1 0 0 / 0.5)' }}>Verification ready</div>
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
          </div>

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

              <div className="flex gap-3">
                {result.ok && (
                  <Button variant="navy" onClick={entry}>
                    <LogIn size={15} /> Grant entry
                  </Button>
                )}
                {!result.ok && p.visit?.status === 'INSIDE' && (
                  <Button variant="navy" onClick={exit}>
                    <LogOut size={15} /> Mark exit
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
