import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';

const DEFAULTS: Record<string, string> = {
  retention_days: '365',
};

export async function GET() {
  const u = await getSession();
  if (!u || u.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { prisma } = await import('@/lib/prisma');
  const rows = await prisma.systemSetting.findMany();
  const settings: Record<string, string> = { ...DEFAULTS };
  for (const r of rows) settings[r.key] = r.value;
  return NextResponse.json({ settings });
}

export async function PATCH(req: Request) {
  const u = await getSession();
  if (!u || u.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { key, value } = z.object({
      key: z.string().min(1).max(60),
      value: z.string().min(1).max(200),
    }).parse(await req.json());
    const { prisma } = await import('@/lib/prisma');
    await prisma.systemSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid input' }, { status: 400 });
  }
}
