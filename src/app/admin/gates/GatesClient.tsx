'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import Badge from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Plus, Pencil, Check, X, DoorOpen } from 'lucide-react';

type GateRow = {
  id: string; name: string; description?: string; active: boolean;
  _count: { guards: number; entryVisits: number };
};

export default function GatesClient({ initialGates }: { initialGates: GateRow[] }) {
  const [gates, setGates] = useState(initialGates);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<{ id: string; name: string; description: string } | null>(null);
  const [toggleConfirm, setToggleConfirm] = useState<GateRow | null>(null);
  const [toggleBusy, setToggleBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    const res = await fetch('/api/admin/gates', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, description: desc || undefined }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error || 'Unable to create gate'); return; }
    setGates(prev => [...prev, { ...data.gate, _count: { guards: 0, entryVisits: 0 } }]);
    setName(''); setDesc('');
    toast.success(`Gate "${data.gate.name}" created`);
  }

  async function patch(id: string, update: Partial<{ name: string; description: string; active: boolean }>) {
    const res = await fetch(`/api/admin/gates/${id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(update),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error || 'Update failed'); return; }
    setGates(prev => prev.map(g => g.id === id ? { ...g, ...data.gate } : g));
    setEditing(null);
    return data;
  }

  async function confirmToggle() {
    if (!toggleConfirm) return;
    setToggleBusy(true);
    await patch(toggleConfirm.id, { active: !toggleConfirm.active });
    toast.success(`Gate "${toggleConfirm.name}" ${toggleConfirm.active ? 'deactivated' : 'activated'}`);
    setToggleBusy(false);
    setToggleConfirm(null);
  }

  return (
    <div className="max-w-4xl flex flex-col gap-5">
      <ConfirmDialog
        open={!!toggleConfirm}
        title={toggleConfirm?.active ? 'Deactivate Gate?' : 'Activate Gate?'}
        description={toggleConfirm?.active
          ? `Guards will no longer be able to use "${toggleConfirm?.name}" for entry/exit.`
          : `Restore "${toggleConfirm?.name}" for use at the gate.`}
        confirmLabel={toggleConfirm?.active ? 'Deactivate' : 'Activate'}
        destructive={!!toggleConfirm?.active}
        loading={toggleBusy}
        onConfirm={confirmToggle}
        onCancel={() => setToggleConfirm(null)}
      />

      {/* Add gate */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'oklch(0.38 0.28 265 / 0.1)', color: 'var(--afit-navy)' }}>
              <Plus size={16} />
            </div>
            <CardTitle>Add Gate</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={create} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Gate name *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Main Gate" required />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Primary visitor entrance" />
              </div>
            </div>
            {error && (
              <div className="rounded-lg px-3 py-2.5 text-sm" style={{ background: 'oklch(0.577 0.245 27.325 / 0.08)', color: 'var(--danger)', border: '1px solid oklch(0.577 0.245 27.325 / 0.2)' }}>
                {error}
              </div>
            )}
            <div>
              <Button type="submit" variant="navy" disabled={busy}>
                <DoorOpen size={15} /> {busy ? 'Creating…' : 'Add gate'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Gates table */}
      <Card>
        <CardHeader>
          <CardTitle>All Gates ({gates.length})</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="afit-gradient-soft">
                {['Name', 'Description', 'Guards', 'Total entries', 'Status', ''].map(h => (
                  <th key={h} className="h-10 px-4 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--afit-navy)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gates.map(g => (
                <tr key={g.id} className="hover:bg-muted/40 transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {editing?.id === g.id
                      ? <Input value={editing.name} onChange={e => setEditing(x => x && { ...x, name: e.target.value })} className="w-40" />
                      : <span className="font-semibold">{g.name}</span>}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--muted-foreground)', minWidth: 160 }}>
                    {editing?.id === g.id
                      ? <Input value={editing.description} onChange={e => setEditing(x => x && { ...x, description: e.target.value })} className="w-48" />
                      : g.description || '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{g._count.guards}</td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{g._count.entryVisits}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><Badge status={g.active ? 'ACTIVE' : 'INACTIVE'} /></td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-2">
                      {editing?.id === g.id ? (
                        <>
                          <Button size="xs" variant="navy" onClick={() => patch(g.id, { name: editing.name, description: editing.description })}>
                            <Check size={12} /> Save
                          </Button>
                          <Button size="xs" variant="outline" onClick={() => setEditing(null)}>
                            <X size={12} /> Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="xs" variant="outline" onClick={() => setEditing({ id: g.id, name: g.name, description: g.description || '' })}>
                            <Pencil size={12} /> Edit
                          </Button>
                          <Button size="xs" variant={g.active ? 'destructive' : 'success'} onClick={() => setToggleConfirm(g)}>
                            {g.active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
