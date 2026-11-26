'use client';
import { useEffect, useState } from 'react';
import QrScanner from './QrScanner';
import Badge from '@/components/ui/Badge';
import { CheckCircle, XCircle, AlertCircle, ScanLine, DoorOpen } from 'lucide-react';

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
  VALID: { label: 'VALID PERMIT', icon: <CheckCircle size={20} />, variant: 'valid' },
  NOT_YET_VALID: { label: 'NOT YET VALID', icon: <AlertCircle size={20} />, variant: 'warn' },
  EXPIRED: { label: 'PERMIT EXPIRED', icon: <XCircle size={20} />, variant: 'invalid' },
  CANCELLED: { label: 'PERMIT CANCELLED', icon: <XCircle size={20} />, variant: 'invalid' },
  ALREADY_USED: { label: 'ALREADY USED', icon: <AlertCircle size={20} />, variant: 'warn' },
  NOT_FOUND: { label: 'PERMIT NOT FOUND', icon: <XCircle size={20} />, variant: 'invalid' },
};

const VARIANT_STYLES = {
  valid: { bg: 'oklch(0.52 0.15 145 / 0.08)', border: 'oklch(0.52 0.15 145 / 0.3)', color: 'oklch(0.35 0.12 145)' },
  invalid: { bg: 'oklch(0.577 0.245 27.325 / 0.08)', border: 'oklch(0.577 0.245 27.325 / 0.3)', color: 'oklch(0.45 0.18 27)' },
  warn: { bg: 'oklch(0.69 0.155 73 / 0.08)', border: 'oklch(0.69 0.155 73 / 0.3)', color: 'oklch(0.5 0.14 73)' },
};

const inputCls = 'h-9 w-full rounded-lg px-3 text-sm outline-none bg-white';
const inputStyle = { border: '1px solid var(--input)' };

export default function GuardClient({ assignedGateId, guardName }: { assignedGateId: string | null; guardName: string }) {
  const [token, setToken] = useState('');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [message, setMessage] = useState('');
  const [gates, setGates] = useState<Gate[]>([]);
  const [gateId, setGateId] = useState('');

  useEffect(() => {
    fetch('/api/gates')
      .then(r => r.json())
      .then(d => {
        const list: Gate[] = d.gates ?? [];
        setGates(list);
        const preferred = assignedGateId ? list.find(g => g.id === assignedGateId) : null;
        setGateId(preferred?.id ?? list[0]?.id ?? '');
      });
  }, [assignedGateId]);

  async function verifyToken(value: string) {
    setMessage(''); setResult(null);
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
    if (!r.ok || d.ok === false) { setMessage(d.error || 'Entry denied'); return; }
    setMessage('Entry granted. Resident has been notified.');
    verifyToken(token);
  }

  async function exit() {
    const r = await fetch('/api/visits/exit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ permitId: result!.permit!.id, gateId }),
    });
    const d = await r.json();
    setMessage(r.ok && d.ok ? 'Exit recorded.' : d.error || 'Unable to record exit');
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
        <div className="rounded-2xl p-5 shadow-sm bg-white" style={{ border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-2">
            <DoorOpen size={16} style={{ color: 'var(--muted-foreground)' }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Gate</span>
          </div>
          <div className="text-xl font-bold" style={{ color: 'var(--afit-navy)' }}>{selectedGateName}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{guardName}</div>
        </div>
        <div className="rounded-2xl p-5 shadow-sm" style={{ background: 'var(--sidebar)', border: '1px solid oklch(1 0 0 / 0.1)' }}>
          <div className="flex items-center gap-2 mb-2">
            <ScanLine size={16} style={{ color: 'oklch(1 0 0 / 0.6)' }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'oklch(1 0 0 / 0.5)' }}>Status</span>
          </div>
          <div className="text-xl font-bold text-white">Active</div>
          <div className="text-xs mt-0.5" style={{ color: 'oklch(1 0 0 / 0.5)' }}>Verification ready</div>
        </div>
      </div>

      {/* Verification panel */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-semibold text-base m-0">Gate Verification</h2>
          <p className="text-sm mt-0.5 m-0" style={{ color: 'var(--muted-foreground)' }}>Scan a QR code or enter a permit number manually.</p>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <QrScanner onToken={v => { setToken(v); verifyToken(v); }} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Gate</label>
              <select className={inputCls} style={inputStyle} value={gateId} onChange={e => setGateId(e.target.value)}>
                {gates.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Permit No. or QR token</label>
              <input className={inputCls} style={inputStyle} value={token} onChange={e => setToken(e.target.value)} placeholder="EST-20260929-A82KF" />
            </div>
          </div>

          <button
            onClick={() => verifyToken(token)}
            className="h-9 px-5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 self-start"
            style={{ background: 'var(--sidebar)' }}
          >
            Verify permit
          </button>
        </div>
      </div>

      {/* Result */}
      {result && cfg && vstyle && (
        <div className="rounded-2xl p-5" style={{ background: vstyle.bg, border: `1px solid ${vstyle.border}` }}>
          <div className="flex items-center gap-2 mb-4" style={{ color: vstyle.color }}>
            {cfg.icon}
            <span className="font-bold text-base tracking-tight">{cfg.label}</span>
          </div>

          {p && (
            <>
              {/* Visitor identity */}
              <div className="flex items-start gap-4 mb-5">
                {p.visitorPhotoUrl && (
                  <img
                    src={p.visitorPhotoUrl}
                    alt={`Photo of ${p.visitor.fullName}`}
                    className="w-20 h-20 rounded-xl object-cover shrink-0"
                    style={{ border: '2px solid white' }}
                  />
                )}
                <div>
                  <div className="text-xl font-bold">{p.visitor.fullName}</div>
                  <div className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{p.visitor.phone}</div>
                  <div className="text-sm mt-2">
                    Visiting <strong>{p.resident.fullName}</strong> · House {p.resident.houseNumber}
                  </div>
                </div>
              </div>

              {/* Permit fields */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm mb-5">
                {[
                  ['Purpose', p.purpose],
                  ['Dates', p.visitEndDate ? `${p.visitDate} – ${p.visitEndDate}` : p.visitDate],
                  ['Time', `${p.startTime}–${p.endTime}`],
                  ['Vehicle', p.vehicleRegistration || 'Not specified'],
                  ['Permit No.', p.permitNumber],
                ].map(([lbl, val]) => (
                  <div key={lbl}>
                    <div className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--muted-foreground)' }}>{lbl}</div>
                    <div className="font-medium">{val}</div>
                  </div>
                ))}
              </div>

              {/* Visit status badge */}
              {p.visit && <div className="mb-4"><Badge status={p.visit.status} /></div>}

              {/* Actions */}
              <div className="flex gap-3">
                {result.ok && (
                  <button onClick={entry} className="h-9 px-5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90" style={{ background: 'var(--sidebar)' }}>
                    Grant entry
                  </button>
                )}
                {!result.ok && p.visit?.status === 'INSIDE' && (
                  <button onClick={exit} className="h-9 px-5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90" style={{ background: 'var(--sidebar)' }}>
                    Mark exit
                  </button>
                )}
              </div>
            </>
          )}

          {message && (
            <div className="mt-4 rounded-lg px-3 py-2.5 text-sm font-medium" style={{ background: 'white', color: 'var(--foreground)', border: '1px solid var(--border)' }}>
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
