'use client';
import { useState } from 'react';
import { Pencil } from 'lucide-react';

type Rule = { id: string; name: string; maxFreeDays: number; chargePerDay: number; currency: string; active: boolean };

const inputCls = 'h-9 w-full rounded-lg px-3 text-sm outline-none bg-white';
const inputStyle = { border: '1px solid var(--input)' };

export default function RulesClient({ initialRules }: { initialRules: Rule[] }) {
  const [rules, setRules] = useState(initialRules);
  const [editing, setEditing] = useState<Rule | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true); setError(''); setSaved(false);
    const res = await fetch('/api/admin/rules', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: editing.id,
        name: editing.name,
        maxFreeDays: Number(editing.maxFreeDays),
        chargePerDay: Number(editing.chargePerDay),
        currency: editing.currency,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error || 'Unable to save'); return; }
    setRules(prev => prev.map(r => r.id === editing.id ? data.rule : r));
    setEditing(null);
    setSaved(true);
  }

  const set = (k: keyof Rule, v: string | number) => setEditing(x => x ? { ...x, [k]: v } : x);

  return (
    <div className="max-w-2xl flex flex-col gap-4">
      {saved && (
        <div className="rounded-lg px-4 py-2.5 text-sm font-medium" style={{ background: 'oklch(0.52 0.15 145 / 0.1)', color: 'oklch(0.35 0.12 145)', border: '1px solid oklch(0.52 0.15 145 / 0.25)' }}>
          Permit rule saved successfully.
        </div>
      )}

      {rules.map(r => (
        <div key={r.id} className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div className="flex items-start justify-between px-5 py-4" style={{ borderBottom: editing?.id === r.id ? '1px solid var(--border)' : undefined }}>
            <div>
              <div className="font-semibold">{r.name}</div>
              <div className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Free for first <strong>{r.maxFreeDays} days</strong> · then{' '}
                <strong>{r.currency} {r.chargePerDay.toLocaleString()}/day</strong>
              </div>
            </div>
            {editing?.id !== r.id && (
              <button
                onClick={() => { setEditing({ ...r }); setSaved(false); }}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium transition-colors"
                style={{ border: '1px solid var(--border)', background: 'white', color: 'var(--foreground)' }}
              >
                <Pencil size={13} /> Edit
              </button>
            )}
          </div>

          {editing?.id === r.id && (
            <form onSubmit={save} className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Rule name</label>
                <input className={inputCls} style={inputStyle} value={editing.name} onChange={e => set('name', e.target.value)} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Free days allowance</label>
                  <input type="number" min={1} max={365} className={inputCls} style={inputStyle} value={editing.maxFreeDays} onChange={e => set('maxFreeDays', e.target.value)} required />
                  <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Permits up to this many days are free</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Charge per excess day</label>
                  <input type="number" min={0} step="0.01" className={inputCls} style={inputStyle} value={editing.chargePerDay} onChange={e => set('chargePerDay', e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Currency code</label>
                <input className={inputCls} style={{ ...inputStyle, maxWidth: 100 }} value={editing.currency} onChange={e => set('currency', e.target.value.toUpperCase())} maxLength={3} required />
              </div>

              {error && (
                <div className="rounded-lg px-3 py-2.5 text-sm" style={{ background: 'oklch(0.577 0.245 27.325 / 0.08)', color: 'var(--danger)', border: '1px solid oklch(0.577 0.245 27.325 / 0.2)' }}>
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button type="submit" disabled={busy} className="h-9 px-4 rounded-lg text-sm font-medium text-white disabled:opacity-60" style={{ background: 'var(--sidebar)' }}>
                  {busy ? 'Saving…' : 'Save changes'}
                </button>
                <button type="button" onClick={() => setEditing(null)} className="h-9 px-4 rounded-lg text-sm font-medium transition-colors" style={{ border: '1px solid var(--border)', background: 'white', color: 'var(--foreground)' }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      ))}

      {rules.length === 0 && (
        <div className="rounded-2xl bg-white shadow-sm p-6 text-center text-sm" style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>
          No permit rules configured. Run the seed to create a default rule.
        </div>
      )}
    </div>
  );
}
