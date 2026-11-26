import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AppShell from '@/components/layout/AppShell';
import PageHeader from '@/components/PageHeader';
import Badge from '@/components/ui/Badge';
import { fetchPermits } from '@/lib/data';

export default async function Permits() {
  const u = await getSession();
  if (!u || u.role !== 'RESIDENT') redirect('/login');
  const permits = await fetchPermits(u);

  return (
    <AppShell user={u} title="My Permits">
      <PageHeader
        title="My Permits"
        description="Your visitor authorisations and gate status."
        backHref="/resident"
        backLabel="Dashboard"
        action={
          <Link href="/resident/permits/new" className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90" style={{ background: 'var(--sidebar)' }}>
            + New Permit
          </Link>
        }
      />

      <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        {permits.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
            No permits yet.{' '}
            <Link href="/resident/permits/new" style={{ color: 'var(--afit-navy)' }}>Create your first visitor permit →</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="h-10 px-5 text-left font-medium whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>Permit No.</th>
                  <th className="h-10 px-3 text-left font-medium whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>Visitor</th>
                  <th className="h-10 px-3 text-left font-medium whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>Visit Date</th>
                  <th className="h-10 px-3 text-left font-medium whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>Category</th>
                  <th className="h-10 px-3 text-left font-medium whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>Status</th>
                  <th className="h-10 px-5 text-right font-medium" style={{ color: 'var(--muted-foreground)' }}></th>
                </tr>
              </thead>
              <tbody>
                {permits.map((p: any) => (
                  <tr key={p.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-5 py-3 whitespace-nowrap font-mono text-xs font-semibold">{p.permitNumber}</td>
                    <td className="px-3 py-3 whitespace-nowrap font-medium">{p.visitor.fullName}</td>
                    <td className="px-3 py-3 whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>{p.visitDate.slice(0, 10)}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{p.permitCategory && <Badge status={p.permitCategory} />}</td>
                    <td className="px-3 py-3 whitespace-nowrap"><Badge status={p.status} /></td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <Link href={`/resident/permits/${p.id}`} className="text-sm font-medium" style={{ color: 'var(--afit-navy)' }}>View</Link>
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
