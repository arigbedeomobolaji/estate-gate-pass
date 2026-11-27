import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  const u = await getSession();
  if (!u || u.role !== 'GUARD') {
    return NextResponse.json({ error: 'Guards only' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (q.length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
  }

  const { prisma } = await import('@/lib/prisma');

  const todayStart = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z');
  const todayEnd = new Date(new Date().toISOString().slice(0, 10) + 'T23:59:59.999Z');

  const permits = await prisma.permit.findMany({
    where: {
      OR: [
        { visitor: { fullName: { contains: q, mode: 'insensitive' } } },
        { resident: { user: { fullName: { contains: q, mode: 'insensitive' } } } },
        { resident: { houseNumber: { contains: q, mode: 'insensitive' } } },
      ],
    },
    include: {
      visitor: { select: { fullName: true } },
      resident: { select: { houseNumber: true, user: { select: { fullName: true } } } },
    },
    orderBy: [
      { visitDate: 'desc' },
    ],
    take: 20,
  });

  // Sort: today's permits first
  const sorted = [
    ...permits.filter(p => p.visitDate >= todayStart && p.visitDate <= todayEnd),
    ...permits.filter(p => p.visitDate < todayStart || p.visitDate > todayEnd),
  ];

  return NextResponse.json({
    permits: sorted.slice(0, 20).map(p => ({
      id: p.id,
      permitNumber: p.permitNumber,
      visitDate: p.visitDate.toISOString().slice(0, 10),
      status: p.status,
      visitor: { fullName: p.visitor.fullName },
      resident: { fullName: p.resident.user.fullName, houseNumber: p.resident.houseNumber },
    })),
  });
}
