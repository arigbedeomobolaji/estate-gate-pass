import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AppShell from '@/components/layout/AppShell';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import Badge from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import PushOptIn from '@/components/PushOptIn';
import { fetchPermits } from '@/lib/data';
import { Users, Clock, CheckCircle, FileText, Plus, ArrowRight } from 'lucide-react';

export default async function Resident() {
  const u = await getSession();
  if (!u || u.role !== 'RESIDENT') redirect('/login');
  const permits = await fetchPermits(u);
  const today = new Date().toISOString().slice(0, 10);
  const todays = permits.filter(p => p.visitDate.slice(0, 10) === today);

  return (
    <AppShell user={u} title="Dashboard">
      <PageHeader
        title={`Welcome, ${u.fullName.split(' ')[0]}`}
        description={u.resident?.houseNumber ? `House ${u.resident.houseNumber}` : 'Resident Dashboard'}
        action={
          <Button variant="navy" asChild>
            <Link href="/resident/permits/new">
              <Plus size={15} /> New Permit
            </Link>
          </Button>
        }
      />

      <PushOptIn />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Today's visitors" value={todays.length} icon={<Users size={18} />} />
        <StatCard label="Currently inside" value={todays.filter(p => p.visit?.status === 'INSIDE').length} icon={<CheckCircle size={18} />} accent />
        <StatCard label="Awaiting arrival" value={todays.filter(p => p.visit?.status === 'EXPECTED').length} icon={<Clock size={18} />} />
        <StatCard label="Total permits" value={permits.length} icon={<FileText size={18} />} />
      </div>

      <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-semibold text-base m-0">Today&apos;s visitors</h2>
          <Link href="/resident/permits" className="text-sm font-semibold flex items-center gap-1 transition-opacity hover:opacity-70" style={{ color: 'var(--afit-navy)' }}>
            View all <ArrowRight size={13} />
          </Link>
        </div>
        {todays.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
            No visitor permits scheduled for today.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="afit-gradient-soft">
                  {['Visitor', 'Time', 'Status', ''].map(h => (
                    <th key={h} className={`h-10 px-5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${h === '' ? 'text-right' : ''}`} style={{ color: 'var(--afit-navy)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {todays.map(p => (
                  <tr key={p.id} className="hover:bg-muted/40 transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-5 py-3 font-semibold whitespace-nowrap">{p.visitor.fullName}</td>
                    <td className="px-5 py-3 whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{p.startTime}–{p.endTime}</td>
                    <td className="px-5 py-3 whitespace-nowrap"><Badge status={p.visit?.status ?? p.status} /></td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <Link href={`/resident/permits/${p.id}`} className="text-sm font-semibold flex items-center justify-end gap-1 transition-opacity hover:opacity-70" style={{ color: 'var(--afit-navy)' }}>
                        View <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
