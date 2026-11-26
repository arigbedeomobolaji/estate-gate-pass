import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AppShell from '@/components/layout/AppShell';
import PageHeader from '@/components/PageHeader';
import AuditClient from './AuditClient';

export default async function AdminAudit() {
  const u = await getSession();
  if (!u || u.role !== 'ADMIN') redirect('/login');

  const { prisma } = await import('@/lib/prisma');
  const [total, logs] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      include: {
        user: { select: { fullName: true, role: true } },
        guard: { select: { user: { select: { fullName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  return (
    <AppShell user={u} title="Audit Log">
      <PageHeader
        title="Audit Log"
        description="Every sensitive action recorded with actor, target, and timestamp."
        backHref="/admin"
        backLabel="Admin Dashboard"
      />
      <AuditClient initial={{ logs: logs.map(l => ({ ...l, createdAt: l.createdAt.toISOString() })) as any, total, page: 1, pages: Math.ceil(total / 50) }} />
    </AppShell>
  );
}
