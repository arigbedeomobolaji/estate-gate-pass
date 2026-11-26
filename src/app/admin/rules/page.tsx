import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AppShell from '@/components/layout/AppShell';
import PageHeader from '@/components/PageHeader';
import RulesClient from './RulesClient';

export default async function AdminRules() {
  const u = await getSession();
  if (!u || u.role !== 'ADMIN') redirect('/login');
  const { prisma } = await import('@/lib/prisma');
  const rules = await prisma.permitRule.findMany({ orderBy: { createdAt: 'asc' } });
  return (
    <AppShell user={u} title="Permit Rules">
      <PageHeader
        title="Permit Rules"
        description="Configure the free-day allowance and charge per excess day for extended permits."
        backHref="/admin"
        backLabel="Admin Dashboard"
      />
      <RulesClient initialRules={rules.map(r => ({ ...r, chargePerDay: Number(r.chargePerDay ?? 0) }))} />
    </AppShell>
  );
}
