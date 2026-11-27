'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Eye, EyeOff, Lock, User, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const FEATURES = [
  'Role-based access control for residents, guards & admins',
  'QR-code permit verification at all entry gates',
  'Real-time push notifications on visitor arrival',
  'Full tamper-evident audit trail',
];

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
      {/* Left hero panel */}
      <div className="afit-gradient-hero hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10 relative overflow-hidden">
        {/* Decorative orb */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full" style={{ background: 'oklch(1 0 0 / 0.04)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-10 -left-16 w-64 h-64 rounded-full" style={{ background: 'oklch(0.68 0.145 73 / 0.08)', filter: 'blur(32px)' }} />

        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'oklch(1 0 0 / 0.15)' }}>
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <div className="text-white font-extrabold text-base tracking-tight leading-tight">Estate Access Control</div>
            <div className="text-[11px] font-medium" style={{ color: 'oklch(1 0 0 / 0.45)' }}>NAF Base Visitor Management</div>
          </div>
        </div>

        <div className="relative">
          <h2 className="text-[2.1rem] font-extrabold text-white leading-tight tracking-tight mb-5">
            Secure Gate Access<br />Management
          </h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: 'oklch(1 0 0 / 0.65)' }}>
            Manage visitor permits, verify gate entry, and maintain a full audit trail for the estate.
          </p>
          <div className="space-y-3">
            {FEATURES.map(f => (
              <div key={f} className="flex items-start gap-2.5 text-sm" style={{ color: 'oklch(1 0 0 / 0.75)' }}>
                <ChevronRight size={15} className="mt-0.5 shrink-0" style={{ color: 'oklch(1 0 0 / 0.45)' }} />
                {f}
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs font-medium" style={{ color: 'oklch(1 0 0 / 0.3)' }}>
          © {new Date().getFullYear()} NAF Base · Estate Access Control
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6" style={{ background: 'var(--background)' }}>
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 afit-gradient-hero">
              <Shield size={18} className="text-white" />
            </div>
            <span className="font-extrabold text-base tracking-tight" style={{ color: 'var(--afit-navy)' }}>Estate Access Control</span>
          </div>

          <div className="mb-8">
            <h1 className="text-[1.65rem] font-extrabold tracking-tight m-0" style={{ color: 'var(--foreground)' }}>Welcome back</h1>
            <p className="text-sm mt-1.5 m-0" style={{ color: 'var(--muted-foreground)' }}>
              Sign in with your service number or email.
            </p>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="identifier">Service Number or Email</Label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted-foreground)' }} />
                <Input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="NAF/12345 or email@example.com"
                  autoComplete="username"
                  required
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted-foreground)' }} />
                <Input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg px-3 py-2.5 text-sm flex items-center gap-2" style={{ background: 'oklch(0.577 0.245 27.325 / 0.08)', color: 'var(--danger)', border: '1px solid oklch(0.577 0.245 27.325 / 0.2)' }}>
                {error}
              </div>
            )}

            <Button type="submit" variant="navy" disabled={busy} className="w-full mt-1 h-10 text-base">
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
