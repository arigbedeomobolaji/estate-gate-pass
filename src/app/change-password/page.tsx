'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, KeyRound } from 'lucide-react';

export default function ChangePassword() {
  const r = useRouter();
  const [f, setF] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setF(x => ({ ...x, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (f.newPassword !== f.confirmPassword) { setError('New passwords do not match'); return; }
    if (f.newPassword === f.currentPassword) { setError('New password must differ from current password'); return; }
    setBusy(true);
    setError('');
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

  return (
    <main className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--sidebar)' }}>
            <Shield size={18} className="text-white" />
          </div>
          <span className="font-bold text-base" style={{ color: 'var(--afit-navy)' }}>Estate Access Control</span>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'oklch(0.69 0.155 73 / 0.12)', color: 'oklch(0.55 0.155 73)' }}>
              <KeyRound size={18} />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'oklch(0.55 0.155 73)' }}>Security Requirement</div>
              <h1 className="text-lg font-bold tracking-tight m-0">Change Your Password</h1>
            </div>
          </div>

          <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            Your account requires a password change before you can continue. Choose a strong password you have not used before.
          </p>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Current (temporary) password</label>
              <input
                type="password"
                value={f.currentPassword}
                onChange={e => set('currentPassword', e.target.value)}
                autoComplete="current-password"
                required
                className="h-9 w-full rounded-lg px-3 text-sm outline-none"
                style={{ border: '1px solid var(--input)', background: 'white' }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                New password <span style={{ color: 'var(--muted-foreground)' }}>(min 8 characters)</span>
              </label>
              <input
                type="password"
                value={f.newPassword}
                onChange={e => set('newPassword', e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                className="h-9 w-full rounded-lg px-3 text-sm outline-none"
                style={{ border: '1px solid var(--input)', background: 'white' }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Confirm new password</label>
              <input
                type="password"
                value={f.confirmPassword}
                onChange={e => set('confirmPassword', e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                className="h-9 w-full rounded-lg px-3 text-sm outline-none"
                style={{ border: '1px solid var(--input)', background: 'white' }}
              />
            </div>

            {error && (
              <div className="rounded-lg px-3 py-2.5 text-sm" style={{ background: 'oklch(0.577 0.245 27.325 / 0.08)', color: 'var(--danger)', border: '1px solid oklch(0.577 0.245 27.325 / 0.2)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="h-9 w-full rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-60 mt-1"
              style={{ background: 'var(--sidebar)' }}
            >
              {busy ? 'Updating…' : 'Set new password'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
