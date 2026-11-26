'use client';
import { useRef, useState } from 'react';
import Badge from '@/components/ui/Badge';
import { UserPlus, Upload, Users, KeyRound, X } from 'lucide-react';

type UserRow = {
  id: string; email: string; fullName: string; role: string; userType: string;
  serviceNumber?: string; mustChangePassword: boolean; active: boolean; createdAt: string;
  resident?: { id: string; houseNumber: string; phone: string };
  guard?: { id: string; assignedGateId?: string; assignedGate?: { name: string } };
};
type Gate = { id: string; name: string };
type FormState = {
  fullName: string; email: string; role: string; userType: string;
  serviceNumber: string; houseNumber: string; phone: string; assignedGateId: string;
};
const EMPTY: FormState = {
  fullName: '', email: '', role: 'RESIDENT', userType: 'PERSONNEL',
  serviceNumber: '', houseNumber: '', phone: '', assignedGateId: '',
};

const inputCls = 'h-9 w-full rounded-lg px-3 text-sm outline-none bg-white';
const inputStyle = { border: '1px solid var(--input)' };

export default function AdminUsersClient({ initialUsers, gates }: { initialUsers: UserRow[]; gates: Gate[] }) {
  const [tab, setTab] = useState<'list' | 'create' | 'bulk'>('list');
  const [users, setUsers] = useState(initialUsers);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ tempPassword: string; name: string; login: string } | null>(null);
  const [bulkResult, setBulkResult] = useState<{ created: number; failed: { row: number; name: string; error: string }[]; credentials: { name: string; email: string; login: string; tempPassword: string }[] } | null>(null);
  const [actionBusy, setActionBusy] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: string, v: string) => setForm(x => ({ ...x, [k]: v }));

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(''); setCreated(null);
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        fullName: form.fullName, email: form.email, role: form.role, userType: form.userType,
        serviceNumber: form.serviceNumber || undefined, houseNumber: form.houseNumber || undefined,
        phone: form.phone || undefined, assignedGateId: form.assignedGateId || undefined,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error || 'Unable to create user'); return; }
    setCreated({ tempPassword: data.tempPassword, name: data.user.fullName, login: data.user.serviceNumber || data.user.email });
    setUsers(prev => [data.user, ...prev]);
    setForm(EMPTY);
    setTab('list');
  }

  async function submitBulk(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) { setError('Please select a file'); return; }
    setBusy(true); setError(''); setBulkResult(null);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin/users/bulk', { method: 'POST', body: fd });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error || 'Import failed'); return; }
    setBulkResult(data);
    const listRes = await fetch('/api/admin/users');
    const listData = await listRes.json();
    if (listData.users) setUsers(listData.users);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function userAction(userId: string, action: string) {
    setActionBusy(userId + action);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action }),
    });
    const data = await res.json();
    setActionBusy('');
    if (!res.ok) { alert(data.error || 'Action failed'); return; }
    if (action === 'reset-password') {
      const user = users.find(u => u.id === userId);
      setCreated({ tempPassword: data.tempPassword, name: user?.fullName || '', login: user?.serviceNumber || user?.email || '' });
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: data.active } : u));
    }
  }

  const TABS = [
    { id: 'list', label: `All Accounts (${users.length})`, icon: <Users size={14} /> },
    { id: 'create', label: 'Create Account', icon: <UserPlus size={14} /> },
    { id: 'bulk', label: 'Bulk Import', icon: <Upload size={14} /> },
  ] as const;

  return (
    <div className="max-w-5xl flex flex-col gap-5">
      {/* Credentials banner */}
      {created && (
        <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: 'oklch(0.52 0.15 145 / 0.1)', border: '1px solid oklch(0.52 0.15 145 / 0.25)' }}>
          <KeyRound size={18} className="shrink-0 mt-0.5" style={{ color: 'oklch(0.35 0.12 145)' }} />
          <div className="flex-1">
            <div className="font-semibold text-sm mb-2" style={{ color: 'oklch(0.35 0.12 145)' }}>Credentials — share with user (shown once only)</div>
            <div className="font-mono text-sm space-y-0.5">
              <div>Name: <strong>{created.name}</strong></div>
              <div>Login: <strong>{created.login}</strong></div>
              <div>Temp password: <strong>{created.tempPassword}</strong></div>
            </div>
            <div className="text-xs mt-2" style={{ color: 'oklch(0.45 0.1 145)' }}>User will be prompted to change this on first login.</div>
          </div>
          <button onClick={() => setCreated(null)} className="shrink-0 p-1 rounded" style={{ color: 'oklch(0.35 0.12 145)' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setError(''); }}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-medium transition-colors"
            style={tab === t.id
              ? { background: 'var(--sidebar)', color: 'white' }
              : { border: '1px solid var(--border)', background: 'white', color: 'var(--foreground)' }
            }
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* CREATE TAB */}
      {tab === 'create' && (
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="font-semibold text-base m-0">Create Account</h2>
          </div>
          <form onSubmit={submitCreate} className="p-5 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Full name *</label>
                <input className={inputCls} style={inputStyle} value={form.fullName} onChange={e => set('fullName', e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email address *</label>
                <input type="email" className={inputCls} style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Role *</label>
                <select className={inputCls} style={inputStyle} value={form.role} onChange={e => set('role', e.target.value)}>
                  <option value="RESIDENT">Resident</option>
                  <option value="GUARD">Guard</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">User type *</label>
                <select className={inputCls} style={inputStyle} value={form.userType} onChange={e => set('userType', e.target.value)}>
                  <option value="PERSONNEL">Personnel (has Service Number)</option>
                  <option value="CIVILIAN">Civilian (no Service Number)</option>
                </select>
              </div>
            </div>
            {form.userType === 'PERSONNEL' && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Service Number *</label>
                <input className={inputCls} style={inputStyle} value={form.serviceNumber} onChange={e => set('serviceNumber', e.target.value)} placeholder="NAF/12345" />
              </div>
            )}
            {form.role === 'RESIDENT' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">House / flat number *</label>
                  <input className={inputCls} style={inputStyle} value={form.houseNumber} onChange={e => set('houseNumber', e.target.value)} placeholder="Block B, Flat 12" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Phone *</label>
                  <input className={inputCls} style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="08030000001" />
                </div>
              </div>
            )}
            {form.role === 'GUARD' && gates.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Assigned gate</label>
                <select className={inputCls} style={inputStyle} value={form.assignedGateId} onChange={e => set('assignedGateId', e.target.value)}>
                  <option value="">— Unassigned —</option>
                  {gates.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            )}

            {error && (
              <div className="rounded-lg px-3 py-2.5 text-sm" style={{ background: 'oklch(0.577 0.245 27.325 / 0.08)', color: 'var(--danger)', border: '1px solid oklch(0.577 0.245 27.325 / 0.2)' }}>
                {error}
              </div>
            )}

            <div>
              <button type="submit" disabled={busy} className="h-9 px-4 rounded-lg text-sm font-medium text-white disabled:opacity-60" style={{ background: 'var(--sidebar)' }}>
                {busy ? 'Creating…' : 'Create account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BULK TAB */}
      {tab === 'bulk' && (
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="font-semibold text-base m-0">Bulk Import Residents</h2>
          </div>
          <div className="p-5 flex flex-col gap-4">
            <p className="text-sm m-0" style={{ color: 'var(--muted-foreground)' }}>
              Upload a CSV or Excel file. Required columns: <strong>fullName, email, houseNumber, phone</strong>.<br />
              Optional: <strong>userType</strong> (PERSONNEL or CIVILIAN, default: PERSONNEL), <strong>serviceNumber</strong> (required for PERSONNEL).
            </p>
            <form onSubmit={submitBulk} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">File (CSV or .xlsx)</label>
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="text-sm" />
              </div>
              {error && (
                <div className="rounded-lg px-3 py-2.5 text-sm" style={{ background: 'oklch(0.577 0.245 27.325 / 0.08)', color: 'var(--danger)', border: '1px solid oklch(0.577 0.245 27.325 / 0.2)' }}>
                  {error}
                </div>
              )}
              <div>
                <button type="submit" disabled={busy} className="h-9 px-4 rounded-lg text-sm font-medium text-white disabled:opacity-60" style={{ background: 'var(--sidebar)' }}>
                  {busy ? 'Importing…' : 'Import'}
                </button>
              </div>
            </form>

            {bulkResult && (
              <div className="flex flex-col gap-3">
                <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'oklch(0.52 0.15 145 / 0.1)', color: 'oklch(0.35 0.12 145)', border: '1px solid oklch(0.52 0.15 145 / 0.25)' }}>
                  <strong>{bulkResult.created} account{bulkResult.created !== 1 ? 's' : ''} created</strong>
                  {bulkResult.failed.length > 0 && <span style={{ color: 'var(--muted-foreground)' }}> · {bulkResult.failed.length} row{bulkResult.failed.length !== 1 ? 's' : ''} skipped</span>}
                </div>

                {bulkResult.credentials.length > 0 && (
                  <details>
                    <summary className="cursor-pointer text-sm font-semibold mb-2">View temporary passwords ({bulkResult.credentials.length})</summary>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                          {['Name', 'Login', 'Temp Password'].map(h => (
                            <th key={h} className="h-9 px-3 text-left font-medium" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                          ))}
                        </tr></thead>
                        <tbody>
                          {bulkResult.credentials.map((c, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td className="px-3 py-2">{c.name}</td>
                              <td className="px-3 py-2 font-mono text-xs">{c.login}</td>
                              <td className="px-3 py-2 font-mono text-xs font-bold">{c.tempPassword}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}

                {bulkResult.failed.length > 0 && (
                  <details>
                    <summary className="cursor-pointer text-sm font-semibold mb-2" style={{ color: 'var(--danger)' }}>Errors ({bulkResult.failed.length})</summary>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                          {['Row', 'Name', 'Error'].map(h => (
                            <th key={h} className="h-9 px-3 text-left font-medium" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                          ))}
                        </tr></thead>
                        <tbody>
                          {bulkResult.failed.map((f, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td className="px-3 py-2">{f.row}</td>
                              <td className="px-3 py-2">{f.name}</td>
                              <td className="px-3 py-2 text-xs" style={{ color: 'var(--danger)' }}>{f.error}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* LIST TAB */}
      {tab === 'list' && (
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="font-semibold text-base m-0">All Accounts ({users.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Name', 'Login', 'Role', 'House / Gate', 'Status', ''].map(h => (
                    <th key={h} className="h-10 px-4 text-left font-medium whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-4 py-3 whitespace-nowrap font-medium">{u.fullName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {u.serviceNumber && <div className="font-mono text-xs font-semibold">{u.serviceNumber}</div>}
                      <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{u.email}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap"><Badge status={u.role} /></td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      {u.resident?.houseNumber || u.guard?.assignedGate?.name || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {!u.active
                        ? <Badge status="INACTIVE" label="Inactive" />
                        : u.mustChangePassword
                          ? <Badge status="EXPECTED" label="Pending login" />
                          : <Badge status="ACTIVE" label="Active" />}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          disabled={actionBusy === u.id + (u.active ? 'deactivate' : 'activate')}
                          onClick={() => userAction(u.id, u.active ? 'deactivate' : 'activate')}
                          className={`h-7 px-3 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${u.active ? 'text-red-600 bg-red-50 border border-red-200' : ''}`}
                          style={!u.active ? { border: '1px solid var(--border)', background: 'white' } : {}}
                        >
                          {u.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          disabled={actionBusy === u.id + 'reset-password'}
                          onClick={() => userAction(u.id, 'reset-password')}
                          className="h-7 px-3 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          style={{ border: '1px solid var(--border)', background: 'white' }}
                        >
                          Reset pwd
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
