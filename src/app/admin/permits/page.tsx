import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AppShell from '@/components/layout/AppShell';
import PageHeader from '@/components/PageHeader';
import PermitsClient from './PermitsClient';

export default async function AdminPermits() {
  const u = await getSession();
  if (!u || u.role !== 'ADMIN') redirect('/login');

  const { prisma } = await import('@/lib/prisma');
  const take = 50;
  const [total, permits] = await Promise.all([
    prisma.permit.count(),
    prisma.permit.findMany({
      include: {
        visitor: { select: { fullName: true, phone: true } },
        resident: { select: { houseNumber: true, user: { select: { fullName: true } } } },
        visit: { select: { status: true, entryAt: true, exitAt: true, entryGate: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take,
    }),
  ]);

  const initial = {
    permits: permits.map(p => ({
      id: p.id,
      permitNumber: p.permitNumber,
      status: p.status,
      permitCategory: p.permitCategory ?? undefined,
      purpose: p.purpose,
      visitDate: p.visitDate.toISOString().slice(0, 10),
      visitEndDate: p.visitEndDate?.toISOString().slice(0, 10) ?? undefined,
      chargeAmount: p.chargeAmount ? Number(p.chargeAmount) : undefined,
      chargeStatus: p.chargeStatus ?? null,
      visitor: p.visitor,
      resident: { fullName: p.resident.user.fullName, houseNumber: p.resident.houseNumber },
      visit: p.visit ? {
        status: p.visit.status,
        entryAt: p.visit.entryAt?.toISOString() ?? undefined,
        exitAt: p.visit.exitAt?.toISOString() ?? undefined,
        entryGate: p.visit.entryGate ?? undefined,
      } : null,
    })),
    total,
    pages: Math.ceil(total / take),
  };

  return (
    <AppShell user={u} title="Permit Monitoring">
      <PageHeader
        title="Permit Monitoring"
        description="Search and inspect all visitor permits across the estate."
        backHref="/admin"
        backLabel="Admin Dashboard"
      />
      <PermitsClient initial={initial} />
    </AppShell>
  );
}
