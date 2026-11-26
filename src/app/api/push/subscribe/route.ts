import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const Body = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

export async function POST(req: Request) {
  const u = await getSession();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });

  const { endpoint, keys } = parsed.data;
  const { prisma } = await import('@/lib/prisma');

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, userId: u.id },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId: u.id },
  });

  return NextResponse.json({ ok: true });
}
