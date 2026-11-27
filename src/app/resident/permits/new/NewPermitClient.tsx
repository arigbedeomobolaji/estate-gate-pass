'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { PermitRule } from '@/lib/types';
import { calcPermitCategory } from '@/lib/permit-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Upload, X, AlertTriangle, Camera, User, Calendar, Car } from 'lucide-react';

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
      toast.error('Could not process photo. Please try another image.');
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
    toast.success('Permit created successfully');
    r.push(`/resident/permits/${d.permit.id}`);
  }

  const isExtended = chargeInfo?.category === 'EXTENDED';

  const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'oklch(0.38 0.28 265 / 0.1)', color: 'var(--afit-navy)' }}>
            {icon}
          </div>
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );

  return (
    <form onSubmit={submit} className="max-w-2xl flex flex-col gap-5">
      {/* Visitor info */}
      <Section icon={<User size={15} />} title="Visitor Information">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Full Name *</Label>
              <Input value={f.fullName} onChange={e => set('fullName', e.target.value)} required placeholder="Visitor full name" />
            </div>
            <div>
              <Label>Phone *</Label>
              <Input value={f.phone} onChange={e => set('phone', e.target.value)} required placeholder="+234…" />
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-1.5">
              <Camera size={13} /> Photograph
              <span className="font-normal text-xs" style={{ color: 'var(--muted-foreground)' }}>(optional)</span>
            </Label>
            <div className="flex items-center gap-4">
              {photo ? (
                <>
                  <img src={photo} alt="Visitor" className="w-16 h-16 rounded-xl object-cover shrink-0" style={{ border: '2px solid var(--border)' }} />
                  <div>
                    <div className="text-sm font-semibold truncate max-w-[180px]">{photoName}</div>
                    <div className="flex gap-3 mt-1">
                      <button type="button" className="text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: 'var(--afit-navy)' }} onClick={() => photoRef.current?.click()}>Change</button>
                      <button type="button" className="text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: 'var(--danger)' }} onClick={() => { setPhoto(''); setPhotoName(''); if (photoRef.current) photoRef.current.value = ''; }}>Remove</button>
                    </div>
                  </div>
                </>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={() => photoRef.current?.click()}>
                  <Upload size={14} /> Upload photo
                </Button>
              )}
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </div>
          </div>
        </div>
      </Section>

      {/* Visit details */}
      <Section icon={<Calendar size={15} />} title="Visit Details">
        <div className="flex flex-col gap-4">
          <div>
            <Label>Purpose of visit *</Label>
            <Input value={f.purpose} onChange={e => set('purpose', e.target.value)} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Visit date *</Label>
              <Input type="date" value={f.visitDate} min={today} onChange={e => { set('visitDate', e.target.value); if (f.visitEndDate < e.target.value) set('visitEndDate', e.target.value); }} required />
            </div>
            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <input type="checkbox" checked={f.multiDay} onChange={e => set('multiDay', e.target.checked)} className="w-4 h-4 rounded accent-afit-navy" />
                <span>Multi-day permit</span>
              </label>
            </div>
          </div>

          {f.multiDay && (
            <div>
              <Label>End date *</Label>
              <Input type="date" value={f.visitEndDate} min={f.visitDate} onChange={e => set('visitEndDate', e.target.value)} required={f.multiDay} />
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
              <Label>Expected arrival *</Label>
              <Input type="time" value={f.startTime} onChange={e => set('startTime', e.target.value)} required />
            </div>
            <div>
              <Label>Expected departure *</Label>
              <Input type="time" value={f.endTime} onChange={e => set('endTime', e.target.value)} required />
            </div>
          </div>
        </div>
      </Section>

      {/* Vehicle */}
      <Section icon={<Car size={15} />} title="Vehicle (Optional)">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Registration</Label>
            <Input value={f.vehicleRegistration} onChange={e => set('vehicleRegistration', e.target.value)} placeholder="e.g. LAG-123-XY" />
          </div>
          <div>
            <Label>Vehicle type</Label>
            <Select value={f.vehicleType} onChange={e => set('vehicleType', e.target.value)}>
              <option value="">Not specified</option>
              <option>Car</option>
              <option>SUV</option>
              <option>Motorcycle</option>
              <option>Bus</option>
              <option>Other</option>
            </Select>
          </div>
        </div>
      </Section>

      {/* Extended permit warning */}
      {isExtended && chargeInfo && rule && (
        <div className="rounded-2xl p-5" style={{ background: 'oklch(0.69 0.155 73 / 0.08)', border: '1px solid oklch(0.69 0.155 73 / 0.3)' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" style={{ color: 'oklch(0.52 0.14 73)' }} />
            <div>
              <div className="font-bold mb-1" style={{ color: 'oklch(0.4 0.12 73)' }}>Extended Permit — Charge Applies</div>
              <p className="text-sm mb-3" style={{ color: 'oklch(0.45 0.1 73)' }}>
                This permit covers <strong>{chargeInfo.days} days</strong>, exceeding the {rule.maxFreeDays}-day free allowance by{' '}
                <strong>{chargeInfo.days - rule.maxFreeDays} days</strong>. A charge of{' '}
                <strong>{rule.currency} {chargeInfo.chargeAmount.toLocaleString()}</strong> will be recorded
                ({rule.currency} {rule.chargePerDay.toLocaleString()}/day). Payment arranged with the estate office.
              </p>
              <label className="flex items-start gap-2.5 cursor-pointer text-sm font-medium" style={{ color: 'oklch(0.4 0.12 73)' }}>
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
        <Button type="submit" variant="navy" disabled={busy || (isExtended && !acknowledged)} size="lg">
          {busy ? 'Creating permit…' : 'Create approved permit'}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => r.push('/resident/permits')}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
