import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';

export async function GET() {
  const u = await getSession();
  if (!u || u.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { prisma } = await import('@/lib/prisma');
  const gates = await prisma.gate.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { guards: true, entryVisits: true } } },
  });
  return NextResponse.json({ gates });
}

export async function POST(req: Request) {
  const u = await getSession();
  if (!u || u.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { name, description } = z.object({
      name: z.string().min(2).max(60),
      description: z.string().max(160).optional(),
    }).parse(await req.json());
    const { prisma } = await import('@/lib/prisma');
    const gate = await prisma.gate.create({ data: { name, description } });
    await prisma.auditLog.create({
      data: { userId: u.id, action: 'CREATE_GATE', targetType: 'Gate', targetId: gate.id, metadata: { name } },
    });
    return NextResponse.json({ gate }, { status: 201 });
  } catch (e: any) {
    if (e?.code === 'P2002') return NextResponse.json({ error: 'A gate with that name already exists' }, { status: 409 });
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unable to create gate' }, { status: 400 });
  }
}
