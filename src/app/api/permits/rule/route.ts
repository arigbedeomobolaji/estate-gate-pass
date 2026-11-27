import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const u = await getSession();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (process.env.DEMO_MODE === 'true') {
    return NextResponse.json({ rule: { id: 'demo', name: 'Standard Rule', maxFreeDays: 30, chargePerDay: 500, currency: 'NGN' } });
  }
  const { prisma } = await import('@/lib/prisma');
  const rule = await prisma.permitRule.findFirst({ where: { active: true }, orderBy: { createdAt: 'asc' } });
  return NextResponse.json({ rule: rule ? { ...rule, chargePerDay: Number(rule.chargePerDay ?? 0) } : null });
}
