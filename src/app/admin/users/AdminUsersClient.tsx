'use client';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import Badge from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { UserPlus, Upload, Users, KeyRound, X, UserCog, RotateCcw } from 'lucide-react';

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

export default function AdminUsersClient({ initialUsers, gates }: { initialUsers: UserRow[]; gates: Gate[] }) {
  const [tab, setTab] = useState<'list' | 'create' | 'bulk'>('list');
  const [users, setUsers] = useState(initialUsers);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ tempPassword: string; name: string; login: string } | null>(null);
  const [bulkResult, setBulkResult] = useState<{ created: number; failed: { row: number; name: string; error: string }[]; credentials: { name: string; email: string; login: string; tempPassword: string }[] } | null>(null);
  const [confirm, setConfirm] = useState<{ userId: string; action: 'deactivate' | 'activate' | 'reset-password'; name: string } | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: string, v: string) => setForm(x => ({ ...x, [k]: v }));

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
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
    toast.success(`Account created for ${data.user.fullName}`);
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
    toast.success(`${data.created} account${data.created !== 1 ? 's' : ''} imported`);
    const listRes = await fetch('/api/admin/users');
    const listData = await listRes.json();
    if (listData.users) setUsers(listData.users);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function confirmAction() {
    if (!confirm) return;
    setActionBusy(true);
    const res = await fetch(`/api/admin/users/${confirm.userId}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: confirm.action }),
    });
    const data = await res.json();
    setActionBusy(false);
    setConfirm(null);
    if (!res.ok) { toast.error(data.error || 'Action failed'); return; }
    if (confirm.action === 'reset-password') {
      setCreated({ tempPassword: data.tempPassword, name: confirm.name, login: users.find(u => u.id === confirm.userId)?.serviceNumber || users.find(u => u.id === confirm.userId)?.email || '' });
      toast.success('Password reset — share credentials with user');
    } else {
      setUsers(prev => prev.map(u => u.id === confirm.userId ? { ...u, active: data.active } : u));
      toast.success(confirm.action === 'deactivate' ? `${confirm.name} deactivated` : `${confirm.name} activated`);
    }
  }

  const TABS = [
    { id: 'list', label: `All Accounts (${users.length})`, icon: <Users size={14} /> },
    { id: 'create', label: 'Create Account', icon: <UserPlus size={14} /> },
    { id: 'bulk', label: 'Bulk Import', icon: <Upload size={14} /> },
  ] as const;

  return (
    <div className="max-w-5xl flex flex-col gap-5">
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.action === 'reset-password' ? 'Reset Password?' : confirm?.action === 'deactivate' ? 'Deactivate Account?' : 'Activate Account?'}
        description={
          confirm?.action === 'reset-password'
            ? `Generate a new temporary password for ${confirm?.name}. They will be required to change it on next login.`
            : confirm?.action === 'deactivate'
            ? `${confirm?.name} will no longer be able to sign in.`
            : `Restore access for ${confirm?.name}.`
        }
        confirmLabel={confirm?.action === 'reset-password' ? 'Reset' : confirm?.action === 'deactivate' ? 'Deactivate' : 'Activate'}
        destructive={confirm?.action === 'deactivate'}
        loading={actionBusy}
        onConfirm={confirmAction}
        onCancel={() => setConfirm(null)}
      />

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
          <Button key={t.id} variant={tab === t.id ? 'navy' : 'outline'} size="sm" onClick={() => { setTab(t.id); setError(''); }}>
            {t.icon}{t.label}
          </Button>
        ))}
      </div>

      {/* CREATE TAB */}
      {tab === 'create' && (
        <Card>
          <CardHeader><CardTitle>Create Account</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submitCreate} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Full name *</Label>
                  <Input value={form.fullName} onChange={e => set('fullName', e.target.value)} required />
                </div>
                <div>
                  <Label>Email address *</Label>
                  <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Role *</Label>
                  <Select value={form.role} onChange={e => set('role', e.target.value)}>
                    <option value="RESIDENT">Resident</option>
                    <option value="GUARD">Guard</option>
                    <option value="ADMIN">Admin</option>
                  </Select>
                </div>
                <div>
                  <Label>User type *</Label>
                  <Select value={form.userType} onChange={e => set('userType', e.target.value)}>
                    <option value="PERSONNEL">Personnel (has Service Number)</option>
                    <option value="CIVILIAN">Civilian (no Service Number)</option>
                  </Select>
                </div>
              </div>
              {form.userType === 'PERSONNEL' && (
                <div>
                  <Label>Service Number *</Label>
                  <Input value={form.serviceNumber} onChange={e => set('serviceNumber', e.target.value)} placeholder="NAF/12345" />
                </div>
              )}
              {form.role === 'RESIDENT' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>House / flat number *</Label>
                    <Input value={form.houseNumber} onChange={e => set('houseNumber', e.target.value)} placeholder="Block B, Flat 12" />
                  </div>
                  <div>
                    <Label>Phone *</Label>
                    <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="08030000001" />
                  </div>
                </div>
              )}
              {form.role === 'GUARD' && gates.length > 0 && (
                <div>
                  <Label>Assigned gate</Label>
                  <Select value={form.assignedGateId} onChange={e => set('assignedGateId', e.target.value)}>
                    <option value="">— Unassigned —</option>
                    {gates.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </Select>
                </div>
              )}
              {error && (
                <div className="rounded-lg px-3 py-2.5 text-sm" style={{ background: 'oklch(0.577 0.245 27.325 / 0.08)', color: 'var(--danger)', border: '1px solid oklch(0.577 0.245 27.325 / 0.2)' }}>
                  {error}
                </div>
              )}
              <div>
                <Button type="submit" variant="navy" disabled={busy}>
                  <UserPlus size={15} /> {busy ? 'Creating…' : 'Create account'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* BULK TAB */}
      {tab === 'bulk' && (
        <Card>
          <CardHeader><CardTitle>Bulk Import Residents</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm m-0" style={{ color: 'var(--muted-foreground)' }}>
              Upload a CSV or Excel file. Required columns: <strong>fullName, email, houseNumber, phone</strong>.<br />
              Optional: <strong>userType</strong> (PERSONNEL or CIVILIAN, default: PERSONNEL), <strong>serviceNumber</strong> (required for PERSONNEL).
            </p>
            <form onSubmit={submitBulk} className="flex flex-col gap-4">
              <div>
                <Label>File (CSV or .xlsx)</Label>
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="text-sm" />
              </div>
              {error && (
                <div className="rounded-lg px-3 py-2.5 text-sm" style={{ background: 'oklch(0.577 0.245 27.325 / 0.08)', color: 'var(--danger)', border: '1px solid oklch(0.577 0.245 27.325 / 0.2)' }}>
                  {error}
                </div>
              )}
              <div>
                <Button type="submit" variant="navy" disabled={busy}>
                  <Upload size={15} /> {busy ? 'Importing…' : 'Import'}
                </Button>
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
          </CardContent>
        </Card>
      )}

      {/* LIST TAB */}
      {tab === 'list' && (
        <Card>
          <CardHeader>
            <CardTitle>All Accounts ({users.length})</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="afit-gradient-soft">
                  {['Name', 'Login', 'Role', 'House / Gate', 'Status', ''].map(h => (
                    <th key={h} className="h-10 px-4 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--afit-navy)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-muted/40 transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-4 py-3 whitespace-nowrap font-semibold">{u.fullName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {u.serviceNumber && <div className="font-mono text-xs font-bold">{u.serviceNumber}</div>}
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
                        <Button
                          variant={u.active ? 'destructive' : 'success'}
                          size="xs"
                          onClick={() => setConfirm({ userId: u.id, action: u.active ? 'deactivate' : 'activate', name: u.fullName })}
                        >
                          <UserCog size={12} /> {u.active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => setConfirm({ userId: u.id, action: 'reset-password', name: u.fullName })}
                        >
                          <RotateCcw size={12} /> Reset pwd
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
