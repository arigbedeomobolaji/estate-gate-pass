import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';

export async function GET() {
  const u = await getSession();
  if (!u || u.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { prisma } = await import('@/lib/prisma');
  const rules = await prisma.permitRule.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json({ rules: rules.map(r => ({ ...r, chargePerDay: Number(r.chargePerDay ?? 0) })) });
}

export async function PATCH(req: Request) {
  const u = await getSession();
  if (!u || u.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { id, maxFreeDays, chargePerDay, currency, name } = z.object({
      id: z.string(),
      name: z.string().min(1).max(60).optional(),
      maxFreeDays: z.number().int().min(1).max(365).optional(),
      chargePerDay: z.number().min(0).optional(),
      currency: z.string().length(3).optional(),
    }).parse(await req.json());
    const { prisma } = await import('@/lib/prisma');
    const rule = await prisma.permitRule.update({
      where: { id },
      data: { ...(name && { name }), ...(maxFreeDays !== undefined && { maxFreeDays }), ...(chargePerDay !== undefined && { chargePerDay }), ...(currency && { currency }) },
    });
    return NextResponse.json({ rule: { ...rule, chargePerDay: Number(rule.chargePerDay ?? 0) } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unable to update rule' }, { status: 400 });
  }
}
