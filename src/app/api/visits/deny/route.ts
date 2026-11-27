import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  const u = await getSession();
  if (!u || u.role !== 'GUARD' || !u.guard) {
    return NextResponse.json({ error: 'Guards only' }, { status: 403 });
  }

  const { permitId, gateId, reason } = await req.json();

  if (!permitId || !reason || String(reason).trim().length < 5) {
    return NextResponse.json({ error: 'permitId and reason (min 5 chars) are required' }, { status: 400 });
  }

  if (process.env.DEMO_MODE === 'true') {
    return NextResponse.json({ ok: true });
  }

  const { prisma } = await import('@/lib/prisma');

  const permit = await prisma.permit.findUnique({
    where: { id: permitId },
    include: { visit: true },
  });

  if (!permit) {
    return NextResponse.json({ error: 'Permit not found' }, { status: 404 });
  }

  const gate = gateId || u.guard.assignedGateId;

  // Upsert the Visit record with DENIED status
  await prisma.visit.upsert({
    where: { permitId },
    update: {
      status: 'DENIED',
      entryGateId: gate,
      entryGuardId: u.guard.id,
      denialReason: String(reason).trim(),
    },
    create: {
      permitId,
      status: 'DENIED',
      entryGateId: gate,
      entryGuardId: u.guard.id,
      denialReason: String(reason).trim(),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: u.id,
      guardId: u.guard.id,
      action: 'DENY_ENTRY',
      targetType: 'Permit',
      targetId: permitId,
      gateId: gate,
      metadata: { reason: String(reason).trim() },
    },
  });

  return NextResponse.json({ ok: true });
}
