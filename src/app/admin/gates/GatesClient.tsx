'use client';
import { useState } from 'react';
import Badge from '@/components/ui/Badge';
import { Plus } from 'lucide-react';

type GateRow = {
  id: string; name: string; description?: string; active: boolean;
  _count: { guards: number; entryVisits: number };
};

const inputCls = 'h-9 w-full rounded-lg px-3 text-sm outline-none bg-white';
const inputStyle = { border: '1px solid var(--input)' };

export default function GatesClient({ initialGates }: { initialGates: GateRow[] }) {
  const [gates, setGates] = useState(initialGates);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<{ id: string; name: string; description: string } | null>(null);

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
  }

  async function patch(id: string, update: Partial<{ name: string; description: string; active: boolean }>) {
    const res = await fetch(`/api/admin/gates/${id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(update),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Update failed'); return; }
    setGates(prev => prev.map(g => g.id === id ? { ...g, ...data.gate } : g));
    setEditing(null);
  }

  return (
    <div className="max-w-4xl flex flex-col gap-5">
      {/* Add gate */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <Plus size={16} style={{ color: 'var(--afit-navy)' }} />
          <h2 className="font-semibold text-base m-0">Add Gate</h2>
        </div>
        <form onSubmit={create} className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Gate name *</label>
              <input className={inputCls} style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Main Gate" required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <input className={inputCls} style={inputStyle} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Primary visitor entrance" />
            </div>
          </div>
          {error && (
            <div className="rounded-lg px-3 py-2.5 text-sm" style={{ background: 'oklch(0.577 0.245 27.325 / 0.08)', color: 'var(--danger)', border: '1px solid oklch(0.577 0.245 27.325 / 0.2)' }}>
              {error}
            </div>
          )}
          <div>
            <button type="submit" disabled={busy} className="h-9 px-4 rounded-lg text-sm font-medium text-white disabled:opacity-60" style={{ background: 'var(--sidebar)' }}>
              {busy ? 'Creating…' : 'Add gate'}
            </button>
          </div>
        </form>
      </div>

      {/* Gates table */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-semibold text-base m-0">All Gates ({gates.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Name', 'Description', 'Guards', 'Total entries', 'Status', ''].map(h => (
                  <th key={h} className="h-10 px-4 text-left font-medium whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gates.map(g => (
                <tr key={g.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {editing?.id === g.id
                      ? <input className={inputCls} style={{ ...inputStyle, width: 160 }} value={editing.name} onChange={e => setEditing(x => x && { ...x, name: e.target.value })} />
                      : <span className="font-medium">{g.name}</span>}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--muted-foreground)', minWidth: 160 }}>
                    {editing?.id === g.id
                      ? <input className={inputCls} style={{ ...inputStyle, width: 200 }} value={editing.description} onChange={e => setEditing(x => x && { ...x, description: e.target.value })} />
                      : g.description || '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{g._count.guards}</td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{g._count.entryVisits}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><Badge status={g.active ? 'ACTIVE' : 'INACTIVE'} /></td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-2">
                      {editing?.id === g.id ? (
                        <>
                          <button className="h-7 px-3 rounded-lg text-xs font-medium text-white" style={{ background: 'var(--sidebar)' }} onClick={() => patch(g.id, { name: editing.name, description: editing.description })}>Save</button>
                          <button className="h-7 px-3 rounded-lg text-xs font-medium transition-colors" style={{ border: '1px solid var(--border)', background: 'white' }} onClick={() => setEditing(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button className="h-7 px-3 rounded-lg text-xs font-medium transition-colors" style={{ border: '1px solid var(--border)', background: 'white' }} onClick={() => setEditing({ id: g.id, name: g.name, description: g.description || '' })}>Edit</button>
                          <button className={`h-7 px-3 rounded-lg text-xs font-medium transition-colors ${g.active ? 'text-red-600 bg-red-50 border border-red-200' : ''}`} style={!g.active ? { border: '1px solid var(--border)', background: 'white' } : {}} onClick={() => patch(g.id, { active: !g.active })}>
                            {g.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
