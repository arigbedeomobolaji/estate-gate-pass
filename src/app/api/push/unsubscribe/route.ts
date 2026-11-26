import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const Body = z.object({ endpoint: z.string().url() });

export async function POST(req: Request) {
  const u = await getSession();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { prisma } = await import('@/lib/prisma');
  await prisma.pushSubscription.deleteMany({
    where: { endpoint: parsed.data.endpoint, userId: u.id },
  });

  return NextResponse.json({ ok: true });
}
