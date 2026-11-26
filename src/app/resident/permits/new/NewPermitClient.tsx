'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { PermitRule } from '@/lib/types';
import { calcPermitCategory } from '@/lib/permit-utils';
import { Upload, X, AlertTriangle } from 'lucide-react';

async function resizePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 400;
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

const inputCls = 'h-9 w-full rounded-lg px-3 text-sm outline-none transition-colors bg-white';
const inputStyle = { border: '1px solid var(--input)' };
const labelCls = 'text-sm font-medium mb-1.5 block';

export default function NewPermitClient() {
  const r = useRouter();
  const photoRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  const [f, setF] = useState({
    fullName: '', phone: '', purpose: 'Personal Visit',
    visitDate: today, multiDay: false, visitEndDate: today,
    startTime: '14:00', endTime: '18:00',
    vehicleRegistration: '', vehicleType: '',
  });
  const [photo, setPhoto] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [rule, setRule] = useState<PermitRule | null>(null);
  const [chargeInfo, setChargeInfo] = useState<{ days: number; category: string; chargeAmount: number } | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k: string, v: string | boolean) => setF(x => ({ ...x, [k]: v }));

  useEffect(() => {
    fetch('/api/permits/rule').then(r => r.json()).then(d => setRule(d.rule));
  }, []);

  useEffect(() => {
    if (!rule) return;
    const endDate = f.multiDay ? f.visitEndDate : null;
    if (endDate && endDate < f.visitDate) return;
    const info = calcPermitCategory(f.visitDate, endDate, rule.maxFreeDays, rule.chargePerDay);
    setChargeInfo(info);
    if (info.category === 'STANDARD') setAcknowledged(false);
  }, [f.visitDate, f.visitEndDate, f.multiDay, rule]);

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const resized = await resizePhoto(file);
      setPhoto(resized);
      setPhotoName(file.name);
    } catch {
      setError('Could not process photo. Please try another image.');
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (chargeInfo?.category === 'EXTENDED' && !acknowledged) {
      setError('Please acknowledge the charge before creating the permit.');
      return;
    }
    setBusy(true); setError('');
    const res = await fetch('/api/permits', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        fullName: f.fullName, phone: f.phone, purpose: f.purpose,
        visitDate: f.visitDate, visitEndDate: f.multiDay ? f.visitEndDate : undefined,
        startTime: f.startTime, endTime: f.endTime,
        vehicleRegistration: f.vehicleRegistration || undefined,
        vehicleType: f.vehicleType || undefined,
        visitorPhotoUrl: photo || undefined,
        chargeAcknowledged: acknowledged,
      }),
    });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) { setError(d.error || 'Unable to create permit'); return; }
    r.push(`/resident/permits/${d.permit.id}`);
  }

  const isExtended = chargeInfo?.category === 'EXTENDED';

  return (
    <form onSubmit={submit} className="max-w-2xl flex flex-col gap-5">
      {/* Visitor info */}
      <div className="rounded-2xl bg-white shadow-sm p-5" style={{ border: '1px solid var(--border)' }}>
        <h3 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--muted-foreground)' }}>Visitor Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Full Name *</label>
            <input className={inputCls} style={inputStyle} value={f.fullName} onChange={e => set('fullName', e.target.value)} required placeholder="Visitor full name" />
          </div>
          <div>
            <label className={labelCls}>Phone *</label>
            <input className={inputCls} style={inputStyle} value={f.phone} onChange={e => set('phone', e.target.value)} required placeholder="+234..." />
          </div>
        </div>

        {/* Photo upload */}
        <div className="mt-4">
          <label className={labelCls}>
            Photograph <span className="font-normal" style={{ color: 'var(--muted-foreground)' }}>(optional — shown to guard on verification)</span>
          </label>
          <div className="flex items-center gap-4">
            {photo ? (
              <>
                <img src={photo} alt="Visitor" className="w-16 h-16 rounded-xl object-cover shrink-0" style={{ border: '1px solid var(--border)' }} />
                <div>
                  <div className="text-sm font-medium truncate max-w-[180px]">{photoName}</div>
                  <div className="flex gap-2 mt-1">
                    <button type="button" className="text-xs font-medium" style={{ color: 'var(--afit-navy)' }} onClick={() => photoRef.current?.click()}>Change</button>
                    <button type="button" className="text-xs font-medium" style={{ color: 'var(--danger)' }} onClick={() => { setPhoto(''); setPhotoName(''); if (photoRef.current) photoRef.current.value = ''; }}>Remove</button>
                  </div>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium transition-colors"
                style={{ border: '1px solid var(--border)', background: 'white', color: 'var(--foreground)' }}
              >
                <Upload size={14} />
                Upload photo
              </button>
            )}
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>
        </div>
      </div>

      {/* Visit details */}
      <div className="rounded-2xl bg-white shadow-sm p-5" style={{ border: '1px solid var(--border)' }}>
        <h3 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--muted-foreground)' }}>Visit Details</h3>

        <div className="mb-4">
          <label className={labelCls}>Purpose of visit *</label>
          <input className={inputCls} style={inputStyle} value={f.purpose} onChange={e => set('purpose', e.target.value)} required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={labelCls}>Visit date *</label>
            <input type="date" className={inputCls} style={inputStyle} value={f.visitDate} min={today} onChange={e => { set('visitDate', e.target.value); if (f.visitEndDate < e.target.value) set('visitEndDate', e.target.value); }} required />
          </div>
          <div className="flex items-end pb-0.5">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={f.multiDay} onChange={e => set('multiDay', e.target.checked)} className="w-4 h-4 rounded" />
              <span>Multi-day permit</span>
            </label>
          </div>
        </div>

        {f.multiDay && (
          <div className="mb-4">
            <label className={labelCls}>End date *</label>
            <input type="date" className={inputCls} style={inputStyle} value={f.visitEndDate} min={f.visitDate} onChange={e => set('visitEndDate', e.target.value)} required={f.multiDay} />
            {rule && chargeInfo && (
              <p className="text-xs mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
                Duration: <strong>{chargeInfo.days} day{chargeInfo.days !== 1 ? 's' : ''}</strong>
                {chargeInfo.days <= rule.maxFreeDays
                  ? ` — within the ${rule.maxFreeDays}-day free allowance`
                  : ` — exceeds ${rule.maxFreeDays}-day free limit`}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Expected arrival *</label>
            <input type="time" className={inputCls} style={inputStyle} value={f.startTime} onChange={e => set('startTime', e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>Expected departure *</label>
            <input type="time" className={inputCls} style={inputStyle} value={f.endTime} onChange={e => set('endTime', e.target.value)} required />
          </div>
        </div>
      </div>

      {/* Vehicle */}
      <div className="rounded-2xl bg-white shadow-sm p-5" style={{ border: '1px solid var(--border)' }}>
        <h3 className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--muted-foreground)' }}>Vehicle (Optional)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Registration</label>
            <input className={inputCls} style={inputStyle} value={f.vehicleRegistration} onChange={e => set('vehicleRegistration', e.target.value)} placeholder="e.g. LAG-123-XY" />
          </div>
          <div>
            <label className={labelCls}>Vehicle type</label>
            <select className={inputCls} style={inputStyle} value={f.vehicleType} onChange={e => set('vehicleType', e.target.value)}>
              <option value="">Not specified</option>
              <option>Car</option>
              <option>SUV</option>
              <option>Motorcycle</option>
              <option>Bus</option>
              <option>Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Extended permit warning */}
      {isExtended && chargeInfo && rule && (
        <div className="rounded-2xl p-5" style={{ background: 'oklch(0.69 0.155 73 / 0.08)', border: '1px solid oklch(0.69 0.155 73 / 0.3)' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" style={{ color: 'oklch(0.55 0.155 73)' }} />
            <div>
              <div className="font-semibold mb-1" style={{ color: 'oklch(0.4 0.12 73)' }}>Extended Permit — Charge Applies</div>
              <p className="text-sm mb-3" style={{ color: 'oklch(0.45 0.1 73)' }}>
                This permit covers <strong>{chargeInfo.days} days</strong>, exceeding the {rule.maxFreeDays}-day free allowance by{' '}
                <strong>{chargeInfo.days - rule.maxFreeDays} days</strong>. A charge of{' '}
                <strong>{rule.currency} {chargeInfo.chargeAmount.toLocaleString()}</strong> will be recorded
                ({rule.currency} {rule.chargePerDay.toLocaleString()}/day). Payment arranged with the estate office.
              </p>
              <label className="flex items-start gap-2.5 cursor-pointer text-sm" style={{ color: 'oklch(0.4 0.12 73)' }}>
                <input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} className="w-4 h-4 rounded mt-0.5 shrink-0" />
                <span>I acknowledge the charge of {rule.currency} {chargeInfo.chargeAmount.toLocaleString()} for this extended permit</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg px-3 py-2.5 text-sm flex items-center gap-2" style={{ background: 'oklch(0.577 0.245 27.325 / 0.08)', color: 'var(--danger)', border: '1px solid oklch(0.577 0.245 27.325 / 0.2)' }}>
          <X size={14} className="shrink-0" />{error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={busy || (isExtended && !acknowledged)}
          className="h-9 px-5 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50"
          style={{ background: 'var(--sidebar)' }}
        >
          {busy ? 'Creating permit…' : 'Create approved permit'}
        </button>
        <button
          type="button"
          onClick={() => r.push('/resident/permits')}
          className="h-9 px-4 rounded-lg text-sm font-medium transition-colors"
          style={{ border: '1px solid var(--border)', background: 'white', color: 'var(--foreground)' }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
