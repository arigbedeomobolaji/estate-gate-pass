'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, KeyRound, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ChangePassword() {
  const r = useRouter();
  const [f, setF] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ cur: false, nw: false, cf: false });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setF(x => ({ ...x, [k]: v }));
  const tog = (k: keyof typeof show) => setShow(x => ({ ...x, [k]: !x[k] }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (f.newPassword !== f.confirmPassword) { setError('New passwords do not match'); return; }
    if (f.newPassword === f.currentPassword) { setError('New password must differ from current password'); return; }
    setBusy(true); setError('');
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ currentPassword: f.currentPassword, newPassword: f.newPassword }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error || 'Unable to change password'); return; }
    r.push(data.role === 'RESIDENT' ? '/resident' : data.role === 'GUARD' ? '/guard' : '/admin');
    r.refresh();
  }

  const PwdInput = ({ id, label, val, k, showKey }: { id: string; label: React.ReactNode; val: string; k: string; showKey: keyof typeof show }) => (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show[showKey] ? 'text' : 'password'}
          value={val}
          onChange={e => set(k, e.target.value)}
          autoComplete={k === 'currentPassword' ? 'current-password' : 'new-password'}
          minLength={k !== 'currentPassword' ? 8 : undefined}
          required
          className="pr-10"
        />
        <button type="button" onClick={() => tog(showKey)} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded" style={{ color: 'var(--muted-foreground)' }}>
          {show[showKey] ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 afit-gradient-hero">
            <Shield size={18} className="text-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight" style={{ color: 'var(--afit-navy)' }}>Estate Access Control</span>
        </div>

        <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div className="afit-gradient-soft px-6 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'oklch(0.69 0.155 73 / 0.15)', color: 'oklch(0.5 0.14 73)' }}>
              <KeyRound size={18} />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'oklch(0.5 0.14 73)' }}>Security Requirement</div>
              <h1 className="text-lg font-extrabold tracking-tight m-0">Change Your Password</h1>
            </div>
          </div>

          <div className="p-6 flex flex-col gap-5">
            <p className="text-sm leading-relaxed m-0" style={{ color: 'var(--muted-foreground)' }}>
              Your account requires a password change before you can continue. Choose a strong password you have not used before.
            </p>

            <form onSubmit={submit} className="flex flex-col gap-4">
              <PwdInput id="cur" label="Current (temporary) password" val={f.currentPassword} k="currentPassword" showKey="cur" />
              <PwdInput id="nw" label={<>New password <span className="font-normal text-muted-foreground">(min 8 chars)</span></>} val={f.newPassword} k="newPassword" showKey="nw" />
              <PwdInput id="cf" label="Confirm new password" val={f.confirmPassword} k="confirmPassword" showKey="cf" />

              {error && (
                <div className="rounded-lg px-3 py-2.5 text-sm" style={{ background: 'oklch(0.577 0.245 27.325 / 0.08)', color: 'var(--danger)', border: '1px solid oklch(0.577 0.245 27.325 / 0.2)' }}>
                  {error}
                </div>
              )}

              <Button type="submit" variant="navy" disabled={busy} className="w-full h-10">
                {busy ? 'Updating…' : 'Set new password'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
