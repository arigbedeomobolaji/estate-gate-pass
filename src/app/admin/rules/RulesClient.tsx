'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Pencil, Save, X } from 'lucide-react';

type Rule = { id: string; name: string; maxFreeDays: number; chargePerDay: number; currency: string; active: boolean };

export default function RulesClient({ initialRules }: { initialRules: Rule[] }) {
  const [rules, setRules] = useState(initialRules);
  const [editing, setEditing] = useState<Rule | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof Rule, v: string | number) => setEditing(x => x ? { ...x, [k]: v } : x);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true); setError('');
    const res = await fetch('/api/admin/rules', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: editing.id, name: editing.name,
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
    toast.success('Permit rule saved');
  }

  return (
    <div className="max-w-2xl flex flex-col gap-4">
      {rules.map(r => (
        <Card key={r.id}>
          <CardHeader>
            <div>
              <CardTitle>{r.name}</CardTitle>
              <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Free for first <strong>{r.maxFreeDays} days</strong> · then{' '}
                <strong>{r.currency} {r.chargePerDay.toLocaleString()}/day</strong>
              </p>
            </div>
            {editing?.id !== r.id && (
              <Button variant="outline" size="sm" onClick={() => setEditing({ ...r })}>
                <Pencil size={13} /> Edit
              </Button>
            )}
          </CardHeader>

          {editing?.id === r.id && (
            <CardContent>
              <form onSubmit={save} className="flex flex-col gap-4">
                <div>
                  <Label>Rule name</Label>
                  <Input value={editing.name} onChange={e => set('name', e.target.value)} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Free days allowance</Label>
                    <Input type="number" min={1} max={365} value={editing.maxFreeDays} onChange={e => set('maxFreeDays', e.target.value)} required />
                    <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>Permits up to this many days are free</p>
                  </div>
                  <div>
                    <Label>Charge per excess day</Label>
                    <Input type="number" min={0} step="0.01" value={editing.chargePerDay} onChange={e => set('chargePerDay', e.target.value)} required />
                  </div>
                </div>
                <div>
                  <Label>Currency code</Label>
                  <Input style={{ maxWidth: 100 }} value={editing.currency} onChange={e => set('currency', e.target.value.toUpperCase())} maxLength={3} required />
                </div>
                {error && (
                  <div className="rounded-lg px-3 py-2.5 text-sm" style={{ background: 'oklch(0.577 0.245 27.325 / 0.08)', color: 'var(--danger)', border: '1px solid oklch(0.577 0.245 27.325 / 0.2)' }}>
                    {error}
                  </div>
                )}
                <div className="flex gap-3">
                  <Button type="submit" variant="navy" disabled={busy}>
                    <Save size={14} /> {busy ? 'Saving…' : 'Save changes'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                    <X size={14} /> Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          )}
        </Card>
      ))}

      {rules.length === 0 && (
        <Card>
          <CardContent className="text-center text-sm py-8" style={{ color: 'var(--muted-foreground)' }}>
            No permit rules configured. Run the seed to create a default rule.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
