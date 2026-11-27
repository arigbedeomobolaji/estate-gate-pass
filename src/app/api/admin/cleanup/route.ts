import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function POST() {
  const u = await getSession();
  if (!u || u.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { prisma } = await import('@/lib/prisma');

  const setting = await prisma.systemSetting.findUnique({ where: { key: 'retention_days' } });
  const retentionDays = Math.max(30, parseInt(setting?.value ?? '365', 10));
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const deleted = await prisma.permit.deleteMany({
    where: {
      visitDate: { lt: cutoff },
      OR: [
        { visit: { status: 'EXITED' } },
        { status: 'CANCELLED', visit: null },
      ],
    },
  });

  return NextResponse.json({ ok: true, deleted: deleted.count, cutoff: cutoff.toISOString(), retentionDays });
}
