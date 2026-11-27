import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  const u = await getSession();
  if (!u || u.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() || '';
  const status = searchParams.get('status') || '';
  const dateFrom = searchParams.get('from') || '';
  const dateTo = searchParams.get('to') || '';
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const take = 50;

  const { prisma } = await import('@/lib/prisma');

  const where: any = {};
  if (status === 'APPROVED' || status === 'CANCELLED') where.status = status;
  if (dateFrom) where.visitDate = { ...(where.visitDate || {}), gte: new Date(`${dateFrom}T00:00:00.000Z`) };
  if (dateTo) where.visitDate = { ...(where.visitDate || {}), lte: new Date(`${dateTo}T23:59:59.999Z`) };
  if (q) {
    where.OR = [
      { permitNumber: { contains: q, mode: 'insensitive' } },
      { visitor: { fullName: { contains: q, mode: 'insensitive' } } },
      { resident: { user: { fullName: { contains: q, mode: 'insensitive' } } } },
      { resident: { houseNumber: { contains: q, mode: 'insensitive' } } },
      { vehicleRegistration: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [total, permits] = await Promise.all([
    prisma.permit.count({ where }),
    prisma.permit.findMany({
      where,
      include: {
        visitor: { select: { fullName: true, phone: true } },
        resident: { select: { houseNumber: true, user: { select: { fullName: true } } } },
        visit: { select: { status: true, entryAt: true, exitAt: true, entryGate: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * take,
      take,
    }),
  ]);

  return NextResponse.json({
    permits: permits.map(p => ({
      id: p.id,
      permitNumber: p.permitNumber,
      status: p.status,
      permitCategory: p.permitCategory,
      purpose: p.purpose,
      visitDate: p.visitDate.toISOString().slice(0, 10),
      visitEndDate: p.visitEndDate?.toISOString().slice(0, 10) ?? null,
      chargeAmount: p.chargeAmount ? Number(p.chargeAmount) : null,
      visitor: p.visitor,
      resident: { fullName: p.resident.user.fullName, houseNumber: p.resident.houseNumber },
      visit: p.visit,
    })),
    total,
    page,
    pages: Math.ceil(total / take),
  });
}
