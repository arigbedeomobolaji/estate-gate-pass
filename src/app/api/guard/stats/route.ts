import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const u = await getSession();
  if (!u || u.role !== 'GUARD') {
    return NextResponse.json({ error: 'Guards only' }, { status: 403 });
  }

  if (process.env.DEMO_MODE === 'true') {
    return NextResponse.json({ insideCount: 3, expectedCount: 7, entriesToday: 5 });
  }

  const { prisma } = await import('@/lib/prisma');

  const todayStart = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z');
  const todayEnd = new Date(new Date().toISOString().slice(0, 10) + 'T23:59:59.999Z');

  const [insideCount, expectedCount, entriesToday] = await Promise.all([
    // Visitors currently inside
    prisma.visit.count({
      where: { status: 'INSIDE' },
    }),
    // Permits for today with no visit yet OR visit status EXPECTED
    prisma.permit.count({
      where: {
        visitDate: { gte: todayStart, lte: todayEnd },
        status: 'APPROVED',
        OR: [
          { visit: null },
          { visit: { status: 'EXPECTED' } },
        ],
      },
    }),
    // Visits where entry happened today
    prisma.visit.count({
      where: {
        entryAt: { gte: todayStart, lte: todayEnd },
      },
    }),
  ]);

  return NextResponse.json({ insideCount, expectedCount, entriesToday });
}
