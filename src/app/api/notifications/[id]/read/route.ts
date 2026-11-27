import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = await getSession();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  if (process.env.DEMO_MODE === 'true') {
    return NextResponse.json({ ok: true });
  }

  const { prisma } = await import('@/lib/prisma');

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== u.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
