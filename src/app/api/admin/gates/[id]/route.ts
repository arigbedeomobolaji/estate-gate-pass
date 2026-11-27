import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';

const schema = z.object({
  name: z.string().min(2).max(60).optional(),
  description: z.string().max(160).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getSession();
  if (!u || u.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  try {
    const data = schema.parse(await req.json());
    const { prisma } = await import('@/lib/prisma');
    const gate = await prisma.gate.update({ where: { id }, data });
    await prisma.auditLog.create({
      data: { userId: u.id, action: 'UPDATE_GATE', targetType: 'Gate', targetId: id, metadata: data },
    });
    return NextResponse.json({ gate });
  } catch (e: any) {
    if (e?.code === 'P2002') return NextResponse.json({ error: 'Gate name already in use' }, { status: 409 });
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unable to update gate' }, { status: 400 });
  }
}
