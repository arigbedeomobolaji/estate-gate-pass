import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function PATCH() {
  const u = await getSession();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (process.env.DEMO_MODE === 'true') {
    return NextResponse.json({ ok: true });
  }

  const { prisma } = await import('@/lib/prisma');

  await prisma.notification.updateMany({
    where: { userId: u.id, readAt: null },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
