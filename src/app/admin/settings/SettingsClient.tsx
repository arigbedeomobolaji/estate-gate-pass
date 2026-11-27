'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Save, Database, Trash2 } from 'lucide-react';

interface Props {
  initialSettings: Record<string, string>;
}

export default function SettingsClient({ initialSettings }: Props) {
  const [retentionDays, setRetentionDays] = useState(initialSettings.retention_days ?? '365');
  const [busy, setBusy] = useState(false);
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);
  const [cleanupBusy, setCleanupBusy] = useState(false);

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
    setBusy(true);
    try {
      await saveSetting('retention_days', retentionDays);
      toast.success('Retention setting saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to save');
    } finally {
      setBusy(false);
    }
  }

  async function handleRunCleanup() {
    setCleanupBusy(true);
    try {
      const res = await fetch('/api/admin/cleanup', { method: 'POST' });
      if (!res.ok) throw new Error((await res.json()).error || 'Cleanup failed');
      const data = await res.json();
      toast.success(`Cleanup complete — ${data.deleted} record${data.deleted !== 1 ? 's' : ''} deleted`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Cleanup failed');
    } finally {
      setCleanupBusy(false);
      setShowCleanupConfirm(false);
    }
  }

  return (
    <div className="max-w-2xl flex flex-col gap-5">
      <ConfirmDialog
        open={showCleanupConfirm}
        title="Run data cleanup?"
        description={`This will permanently delete all completed and cancelled permits with a visit date older than ${retentionDays} days. Associated visit records are also removed. This cannot be undone.`}
        confirmLabel="Run cleanup"
        destructive
        loading={cleanupBusy}
        onConfirm={handleRunCleanup}
        onCancel={() => setShowCleanupConfirm(false)}
      />

      {/* Data Retention */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'oklch(0.38 0.28 265 / 0.1)', color: 'var(--afit-navy)' }}>
              <Database size={18} />
            </div>
            <div>
              <CardTitle>Data Retention</CardTitle>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Completed and cancelled records older than this period are eligible for automatic cleanup.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div>
              <Label>Retention period (days)</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={30}
                  max={3650}
                  value={retentionDays}
                  onChange={e => setRetentionDays(e.target.value)}
                  required
                  style={{ maxWidth: 120 }}
                />
                <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  ≈ {Math.round(Number(retentionDays) / 30)} months
                </span>
              </div>
              <p className="text-xs mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
                Minimum 30 days. The Vercel cron job runs daily at 02:00 UTC to remove eligible records.
              </p>
            </div>
            <div>
              <Button type="submit" variant="navy" disabled={busy}>
                <Save size={14} /> {busy ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Manual Cleanup */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'oklch(0.577 0.245 27.325 / 0.08)', color: 'var(--danger)' }}>
              <Trash2 size={18} />
            </div>
            <div>
              <CardTitle>Manual Cleanup</CardTitle>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                Run the retention job immediately without waiting for the nightly cron.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm m-0" style={{ color: 'var(--muted-foreground)' }}>
            Removes all EXITED or CANCELLED permits with a visit date older than <strong>{retentionDays} days</strong>. This action is irreversible.
          </p>
          <div>
            <Button variant="destructive" onClick={() => setShowCleanupConfirm(true)}>
              <Trash2 size={14} /> Run cleanup now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
