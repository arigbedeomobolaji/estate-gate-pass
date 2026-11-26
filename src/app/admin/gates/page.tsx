import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AppShell from '@/components/layout/AppShell';
import PageHeader from '@/components/PageHeader';
import GatesClient from './GatesClient';

export default async function AdminGates() {
  const u = await getSession();
  if (!u || u.role !== 'ADMIN') redirect('/login');
  const { prisma } = await import('@/lib/prisma');
  const gates = await prisma.gate.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { guards: true, entryVisits: true } } },
  });
  return (
    <AppShell user={u} title="Gate Management">
      <PageHeader
        title="Gates"
        description="Create, rename, and activate gates across the estate."
        backHref="/admin"
        backLabel="Admin Dashboard"
      />
      <GatesClient initialGates={gates as any} />
    </AppShell>
  );
}
