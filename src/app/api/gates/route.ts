import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDemoGates } from '@/lib/demo-store';

export async function GET() {
  const u = await getSession();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (process.env.DEMO_MODE === 'true') return NextResponse.json({ gates: getDemoGates() });
  const { prisma } = await import('@/lib/prisma');
  const gates = await prisma.gate.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
  return NextResponse.json({ gates });
}
