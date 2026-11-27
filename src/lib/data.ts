import type { User, Permit } from './types';

export async function fetchPermits(user: User): Promise<Permit[]> {
  if (process.env.DEMO_MODE === 'true') {
    const { listDemoPermits } = await import('./demo-store');
    return listDemoPermits(user);
  }
  const { prisma } = await import('./prisma');
  const where = user.role === 'RESIDENT' ? { resident: { userId: user.id } } : {};
  const rows = await prisma.permit.findMany({
    where,
    include: { visitor: true, resident: { include: { user: true } }, visit: { include: { entryGate: true, exitGate: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return rows.map(p => ({
    id: p.id,
    permitNumber: p.permitNumber,
    qrToken: '',
    visitor: { id: p.visitor.id, fullName: p.visitor.fullName, phone: p.visitor.phone },
    resident: { id: p.resident.id, fullName: p.resident.user.fullName, houseNumber: p.resident.houseNumber },
    purpose: p.purpose,
    visitDate: p.visitDate.toISOString(),
    visitEndDate: p.visitEndDate?.toISOString() ?? undefined,
    startTime: p.startTime,
    endTime: p.endTime,
    vehicleRegistration: p.vehicleRegistration ?? undefined,
    vehicleType: p.vehicleType ?? undefined,
    visitorPhotoUrl: p.visitorPhotoUrl ?? undefined,
    permitCategory: (p.permitCategory as Permit['permitCategory']) ?? undefined,
    chargeAmount: p.chargeAmount ? Number(p.chargeAmount) : undefined,
    status: p.status as Permit['status'],
    visit: p.visit ? {
      id: p.visit.id,
      status: p.visit.status as NonNullable<Permit['visit']>['status'],
      entryAt: p.visit.entryAt?.toISOString(),
      exitAt: p.visit.exitAt?.toISOString(),
      entryGate: p.visit.entryGate?.name,
      exitGate: p.visit.exitGate?.name,
    } : undefined,
  }));
}
