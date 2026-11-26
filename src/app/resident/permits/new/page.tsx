'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { PermitRule } from '@/lib/types';
import { calcPermitCategory } from '@/lib/permit-utils';

async function resizePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 400;
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export default function NewPermit() {
  const r = useRouter();
  const photoRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({
    fullName: '', phone: '', purpose: 'Personal Visit',
    visitDate: today, multiDay: false, visitEndDate: today,
    startTime: '14:00', endTime: '18:00',
    vehicleRegistration: '', vehicleType: '',
  });
  const [photo, setPhoto] = useState(''); // base64 data URL
  const [photoName, setPhotoName] = useState('');
  const [rule, setRule] = useState<PermitRule | null>(null);
  const [chargeInfo, setChargeInfo] = useState<{ days: number; category: string; chargeAmount: number } | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k: string, v: string | boolean) => setF(x => ({ ...x, [k]: v }));

  // Fetch permit rule on mount
  useEffect(() => {
    fetch('/api/permits/rule').then(r => r.json()).then(d => setRule(d.rule));
  }, []);

  // Recalculate charge whenever dates change
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
    setBusy(true);
    setError('');
    const res = await fetch('/api/permits', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        fullName: f.fullName,
        phone: f.phone,
        purpose: f.purpose,
        visitDate: f.visitDate,
        visitEndDate: f.multiDay ? f.visitEndDate : undefined,
        startTime: f.startTime,
        endTime: f.endTime,
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
    <main className="container">
      <div className="card" style={{ maxWidth: 760, margin: '30px auto' }}>
        <h1 className="title">Create Visitor Permit</h1>
        <p className="subtitle">Approved automatically for registered residents.</p>

        <form className="form" style={{ marginTop: 24 }} onSubmit={submit}>
          {/* Visitor info */}
          <div className="row">
            <div className="field">
              <label>Visitor full name *</label>
              <input value={f.fullName} onChange={e => set('fullName', e.target.value)} required />
            </div>
            <div className="field">
              <label>Phone *</label>
              <input value={f.phone} onChange={e => set('phone', e.target.value)} required />
            </div>
          </div>

          {/* Visitor photo */}
          <div className="field">
            <label>Visitor photograph <span className="muted">(optional — displayed to guard on verification)</span></label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={() => photoRef.current?.click()}>
                {photo ? 'Change photo' : 'Upload photo'}
              </button>
              {photo && (
                <>
                  <img src={photo} alt="Visitor" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--line)' }} />
                  <span className="muted" style={{ fontSize: 13 }}>{photoName}</span>
                  <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => { setPhoto(''); setPhotoName(''); if (photoRef.current) photoRef.current.value = ''; }}>Remove</button>
                </>
              )}
            </div>
            <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
          </div>

          {/* Purpose */}
          <div className="field">
            <label>Purpose of visit *</label>
            <input value={f.purpose} onChange={e => set('purpose', e.target.value)} required />
          </div>

          {/* Dates */}
          <div className="row">
            <div className="field">
              <label>Visit date *</label>
              <input type="date" value={f.visitDate} min={today} onChange={e => { set('visitDate', e.target.value); if (f.visitEndDate < e.target.value) set('visitEndDate', e.target.value); }} required />
            </div>
            <div className="field" style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 0, paddingBottom: 10 }}>
                <input type="checkbox" checked={f.multiDay} onChange={e => set('multiDay', e.target.checked)} style={{ width: 'auto' }} />
                Multi-day permit
              </label>
            </div>
          </div>

          {f.multiDay && (
            <div className="field">
              <label>End date *</label>
              <input type="date" value={f.visitEndDate} min={f.visitDate} onChange={e => set('visitEndDate', e.target.value)} required={f.multiDay} />
              {rule && chargeInfo && (
                <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                  Duration: {chargeInfo.days} day{chargeInfo.days !== 1 ? 's' : ''}
                  {chargeInfo.days <= rule.maxFreeDays
                    ? ` — within the ${rule.maxFreeDays}-day free allowance`
                    : ` — exceeds ${rule.maxFreeDays}-day free limit`}
                </div>
              )}
            </div>
          )}

          {/* Times */}
          <div className="row">
            <div className="field">
              <label>Expected arrival *</label>
              <input type="time" value={f.startTime} onChange={e => set('startTime', e.target.value)} required />
            </div>
            <div className="field">
              <label>Expected departure *</label>
              <input type="time" value={f.endTime} onChange={e => set('endTime', e.target.value)} required />
            </div>
          </div>

          {/* Vehicle */}
          <div className="row">
            <div className="field">
              <label>Vehicle registration</label>
              <input value={f.vehicleRegistration} onChange={e => set('vehicleRegistration', e.target.value)} />
            </div>
            <div className="field">
              <label>Vehicle type</label>
              <select value={f.vehicleType} onChange={e => set('vehicleType', e.target.value)}>
                <option value="">Not specified</option>
                <option>Car</option>
                <option>SUV</option>
                <option>Motorcycle</option>
                <option>Bus</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          {/* Extended permit charge warning */}
          {isExtended && chargeInfo && rule && (
            <div style={{ background: '#fff8e1', border: '1px solid #f9a825', borderRadius: 8, padding: 16, marginTop: 8 }}>
              <strong>Extended Permit — Charge Applies</strong>
              <p style={{ margin: '8px 0 0', fontSize: 14 }}>
                This permit covers <strong>{chargeInfo.days} days</strong>, which exceeds the {rule.maxFreeDays}-day free allowance by{' '}
                <strong>{chargeInfo.days - rule.maxFreeDays} days</strong>.
                A charge of <strong>{rule.currency} {chargeInfo.chargeAmount.toLocaleString()}</strong> will be recorded
                ({rule.currency} {rule.chargePerDay.toLocaleString()} per excess day).
                Payment will be arranged with the estate office.
              </p>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} style={{ width: 'auto' }} />
                I acknowledge the charge of {rule.currency} {chargeInfo.chargeAmount.toLocaleString()} for this extended permit
              </label>
            </div>
          )}

          {error && <div className="error">{error}</div>}

          <div className="actions">
            <button className="btn btn-primary" disabled={busy || (isExtended && !acknowledged)}>
              {busy ? 'Creating…' : 'Create approved permit'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => r.push('/resident')}>Cancel</button>
          </div>
        </form>
      </div>
    </main>
  );
}
