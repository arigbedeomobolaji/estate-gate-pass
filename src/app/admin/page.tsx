import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import { Users, UserCheck, FileText, Activity, DoorOpen, ClipboardList, Settings, SlidersHorizontal, LogIn, LogOut, Clock, XCircle } from 'lucide-react';

export default async function Admin() {
  const u = await getSession();
  if (!u || u.role !== 'ADMIN') redirect('/login');

  const { prisma } = await import('@/lib/prisma');
  const todayUTC = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z');

  const tomorrowUTC = new Date(todayUTC.getTime() + 24 * 60 * 60 * 1000);

  const [visitorsToday, currentInside, activePermits, totalUsers, recentAudits, exitsToday, expectedToday, cancelledPermits] = await Promise.all([
    prisma.visit.count({ where: { entryAt: { gte: todayUTC } } }),
    prisma.visit.count({ where: { status: 'INSIDE' } }),
    prisma.permit.count({ where: { status: 'APPROVED' } }),
    prisma.user.count({ where: { active: true } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { user: { select: { fullName: true } }, guard: { select: { user: { select: { fullName: true } } } } },
    }),
    prisma.visit.count({ where: { exitAt: { gte: todayUTC } } }),
    prisma.permit.count({
      where: {
        status: 'APPROVED',
        visitDate: { gte: todayUTC, lt: tomorrowUTC },
      },
    }),
    prisma.permit.count({ where: { status: 'CANCELLED' } }),
  ]);

  const NAV = [
    { href: '/admin/users', label: 'Users & Accounts', desc: 'Create, import, activate/deactivate', icon: <Users size={18} /> },
    { href: '/admin/gates', label: 'Gates', desc: 'Create, rename, deactivate gates', icon: <DoorOpen size={18} /> },
    { href: '/admin/permits', label: 'Permit Monitoring', desc: 'Search all visitor permits', icon: <FileText size={18} /> },
    { href: '/admin/audit', label: 'Audit Log', desc: 'Full tamper-evident event trail', icon: <ClipboardList size={18} /> },
    { href: '/admin/rules', label: 'Permit Rules', desc: 'Configure free days & charges', icon: <Settings size={18} /> },
    { href: '/admin/settings', label: 'System Settings', desc: 'Data retention & operational config', icon: <SlidersHorizontal size={18} /> },
  ];

  return (
    <AppShell user={u} title="Admin Dashboard">
      <PageHeader title="Administrator Dashboard" description="Estate-wide visitor and gate activity." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Visitors today" value={visitorsToday} icon={<Users size={18} />} />
        <StatCard label="Currently inside" value={currentInside} icon={<UserCheck size={18} />} accent />
        <StatCard label="Active permits" value={activePermits} icon={<FileText size={18} />} />
        <StatCard label="Active accounts" value={totalUsers} icon={<Activity size={18} />} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Entries today" value={visitorsToday} icon={<LogIn size={18} />} />
        <StatCard label="Exits today" value={exitsToday} icon={<LogOut size={18} />} />
        <StatCard label="Expected today" value={expectedToday} icon={<Clock size={18} />} />
        <StatCard label="Cancelled permits" value={cancelledPermits} icon={<XCircle size={18} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Nav cards */}
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="font-semibold text-base m-0">Management</h2>
          </div>
          <div className="p-3 flex flex-col gap-1">
            {NAV.map(n => (
              <Link
                key={n.href}
                href={n.href}
                className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-[var(--muted)]"
                style={{ color: 'var(--foreground)' }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'oklch(0.38 0.28 265 / 0.1)', color: 'var(--afit-navy)' }}>
                  {n.icon}
                </div>
                <div>
                  <div className="font-semibold text-sm">{n.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{n.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="font-semibold text-base m-0">Recent activity</h2>
            <Link href="/admin/audit" className="text-sm font-medium" style={{ color: 'var(--afit-navy)' }}>View all →</Link>
          </div>
          <div className="divide-y" style={{ '--tw-divide-opacity': '1' } as any}>
            {recentAudits.length === 0 ? (
              <div className="px-5 py-6 text-sm text-center" style={{ color: 'var(--muted-foreground)' }}>No activity yet.</div>
            ) : recentAudits.map((a: any) => (
              <div key={a.id} className="px-5 py-3">
                <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--afit-navy)' }}>{a.action.replace(/_/g, ' ')}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  {a.user?.fullName || a.guard?.user?.fullName || 'System'} · {new Date(a.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
