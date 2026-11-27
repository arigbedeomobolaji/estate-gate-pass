'use client';
import { useState } from 'react';
import { Save, Database, Trash2 } from 'lucide-react';

const inputCls = 'h-9 rounded-lg px-3 text-sm outline-none bg-white';
const inputStyle = { border: '1px solid var(--input)' };

interface Props {
  initialSettings: Record<string, string>;
}

export default function SettingsClient({ initialSettings }: Props) {
  const [retentionDays, setRetentionDays] = useState(initialSettings.retention_days ?? '365');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [runningCleanup, setRunningCleanup] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{ deleted: number; cutoff: string } | null>(null);

  async function saveSetting(key: string, value: string) {
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(''); setSaved(false);
    try {
      await saveSetting('retention_days', retentionDays);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save');
    } finally {
      setBusy(false);
    }
  }

  async function handleRunCleanup() {
    if (!confirm(`This will permanently delete completed/cancelled permits older than ${retentionDays} days and all associated visit records. Continue?`)) return;
    setRunningCleanup(true); setCleanupResult(null); setError('');
    try {
      const res = await fetch('/api/admin/cleanup', { method: 'POST' });
      if (!res.ok) throw new Error((await res.json()).error || 'Cleanup failed');
      const data = await res.json();
      setCleanupResult({ deleted: data.deleted, cutoff: data.cutoff });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cleanup failed');
    } finally {
      setRunningCleanup(false);
    }
  }

  return (
    <div className="max-w-2xl flex flex-col gap-5">
      {/* Data Retention */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'oklch(0.38 0.28 265 / 0.1)', color: 'var(--afit-navy)' }}>
            <Database size={18} />
          </div>
          <div>
            <div className="font-semibold text-sm">Data Retention</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Completed and cancelled permit records older than this period are eligible for automatic cleanup.
            </div>
          </div>
        </div>
        <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Retention period (days)</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={30}
                max={3650}
                className={inputCls}
                style={{ ...inputStyle, width: 120 }}
                value={retentionDays}
                onChange={e => { setRetentionDays(e.target.value); setSaved(false); }}
                required
              />
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                ≈ {Math.round(Number(retentionDays) / 30)} months
              </span>
            </div>
            <p className="text-xs mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
              Minimum 30 days. The Vercel cron job runs daily at 02:00 UTC to remove eligible records.
            </p>
          </div>

          {saved && (
            <div className="rounded-lg px-4 py-2.5 text-sm font-medium" style={{ background: 'oklch(0.52 0.15 145 / 0.1)', color: 'oklch(0.35 0.12 145)', border: '1px solid oklch(0.52 0.15 145 / 0.25)' }}>
              Retention setting saved.
            </div>
          )}
          {error && (
            <div className="rounded-lg px-3 py-2.5 text-sm" style={{ background: 'oklch(0.577 0.245 27.325 / 0.08)', color: 'var(--danger)', border: '1px solid oklch(0.577 0.245 27.325 / 0.2)' }}>
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={busy} className="h-9 px-4 rounded-lg text-sm font-medium text-white flex items-center gap-1.5 disabled:opacity-60" style={{ background: 'var(--sidebar)' }}>
              <Save size={14} /> {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      {/* Manual Cleanup */}
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'oklch(0.577 0.245 27.325 / 0.08)', color: 'var(--danger)' }}>
            <Trash2 size={18} />
          </div>
          <div>
            <div className="font-semibold text-sm">Manual Cleanup</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              Run the retention job immediately without waiting for the nightly cron.
            </div>
          </div>
        </div>
        <div className="p-5 flex flex-col gap-4">
          {cleanupResult && (
            <div className="rounded-lg px-4 py-2.5 text-sm font-medium" style={{ background: 'oklch(0.52 0.15 145 / 0.1)', color: 'oklch(0.35 0.12 145)', border: '1px solid oklch(0.52 0.15 145 / 0.25)' }}>
              Deleted {cleanupResult.deleted} record{cleanupResult.deleted !== 1 ? 's' : ''} with visit date before {new Date(cleanupResult.cutoff).toLocaleDateString()}.
            </div>
          )}
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Removes all EXITED or CANCELLED permits with a visit date older than <strong>{retentionDays} days</strong>. This action is irreversible.
          </p>
          <div>
            <button
              type="button"
              disabled={runningCleanup}
              onClick={handleRunCleanup}
              className="h-9 px-4 rounded-lg text-sm font-medium flex items-center gap-1.5 disabled:opacity-60 transition-colors"
              style={{ border: '1px solid var(--danger)', color: 'var(--danger)', background: 'white' }}
            >
              <Trash2 size={14} /> {runningCleanup ? 'Running…' : 'Run cleanup now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
