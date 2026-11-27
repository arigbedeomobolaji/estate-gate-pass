import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { prisma } = await import('@/lib/prisma');

  const setting = await prisma.systemSetting.findUnique({ where: { key: 'retention_days' } });
  const retentionDays = Math.max(30, parseInt(setting?.value ?? '365', 10));
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  // Delete only completed or cancelled permits older than the cutoff.
  // Visit rows are cascade-deleted by Prisma (onDelete: Cascade).
  const deleted = await prisma.permit.deleteMany({
    where: {
      visitDate: { lt: cutoff },
      OR: [
        { visit: { status: 'EXITED' } },
        { status: 'CANCELLED', visit: null },
      ],
    },
  });

  return NextResponse.json({
    ok: true,
    deleted: deleted.count,
    cutoff: cutoff.toISOString(),
    retentionDays,
  });
}
