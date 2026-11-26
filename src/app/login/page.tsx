'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const r = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error || 'Unable to sign in'); return; }
    if (data.user.mustChangePassword) { r.push('/change-password'); return; }
    r.push(data.user.role === 'RESIDENT' ? '/resident' : data.user.role === 'GUARD' ? '/guard' : '/admin');
    r.refresh();
  }

  return (
    <main className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-96 shrink-0 p-10" style={{ background: 'var(--sidebar)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'oklch(1 0 0 / 0.12)' }}>
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-base tracking-wide">Estate Access Control</div>
            <div className="text-xs" style={{ color: 'oklch(1 0 0 / 0.4)' }}>NAF Base Visitor Management</div>
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-4 tracking-tight">
            Secure Gate Access Management
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'oklch(1 0 0 / 0.6)' }}>
            Manage visitor permits, verify gate entry, and maintain a full audit trail for the estate.
          </p>
          <div className="mt-8 space-y-3">
            {['Role-based access control', 'Permit QR verification', 'Real-time push notifications'].map(f => (
              <div key={f} className="flex items-center gap-2.5 text-sm" style={{ color: 'oklch(1 0 0 / 0.7)' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-white/50 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs" style={{ color: 'oklch(1 0 0 / 0.3)' }}>
          © {new Date().getFullYear()} NAF Base · Estate Access Control
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6" style={{ background: 'var(--background)' }}>
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--sidebar)' }}>
              <Shield size={18} className="text-white" />
            </div>
            <span className="font-bold text-base" style={{ color: 'var(--afit-navy)' }}>Estate Access Control</span>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-bold tracking-tight m-0">Sign in</h1>
            <p className="text-sm mt-1 m-0" style={{ color: 'var(--muted-foreground)' }}>
              Enter your service number or email to continue.
            </p>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Service Number or Email</label>
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="NAF/12345 or email@example.com"
                autoComplete="username"
                required
                className="h-9 w-full rounded-lg px-3 text-sm outline-none transition-colors"
                style={{ border: '1px solid var(--input)', background: 'white' }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="h-9 w-full rounded-lg px-3 pr-10 text-sm outline-none transition-colors"
                  style={{ border: '1px solid var(--input)', background: 'white' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
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
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
