import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { grantDemoEntry } from '@/lib/demo-store';
import { hashToken, validTimeWindow } from '@/lib/permit';
import { sendPushToUser } from '@/lib/push';

export async function POST(req: Request) {
  const u = await getSession();
  if (!u || u.role !== 'GUARD' || !u.guard) {
    return NextResponse.json({ error: 'Guards only' }, { status: 403 });
  }
  const { permitId, token, gateId } = await req.json();

  if (process.env.DEMO_MODE === 'true') return NextResponse.json(grantDemoEntry(u, permitId, gateId));

  const { prisma } = await import('@/lib/prisma');
  const p = await prisma.permit.findFirst({
    where: { OR: [{ id: permitId }, { permitNumber: token }, { qrTokenHash: token ? hashToken(token) : '__' }] },
    include: { visit: true, resident: { include: { user: true } } },
  });

  if (!p) return NextResponse.json({ error: 'Permit not found' }, { status: 404 });

  const code = p.status === 'CANCELLED'
    ? 'CANCELLED'
    : validTimeWindow(
        p.visitDate.toISOString().slice(0, 10),
        p.startTime,
        p.endTime,
        new Date(),
        p.visitEndDate?.toISOString().slice(0, 10),
      );

  if (code !== 'VALID' || p.visit?.status !== 'EXPECTED') {
    return NextResponse.json({ error: code === 'VALID' ? 'ALREADY_USED' : code }, { status: 409 });
  }

  const gate = gateId || u.guard.assignedGateId;
  const gateRecord = gate ? await prisma.gate.findUnique({ where: { id: gate } }) : null;

  const visit = await prisma.visit.update({
    where: { permitId: p.id },
    data: { status: 'INSIDE', entryAt: new Date(), entryGateId: gate, entryGuardId: u.guard.id },
  });

  const notifTitle = 'Visitor arrived';
  const notifBody = `Your visitor has arrived at ${gateRecord?.name ?? 'the gate'}.`;

  await prisma.notification.create({
    data: {
      userId: p.resident.userId,
      type: 'VISITOR_ARRIVAL',
      title: notifTitle,
      message: notifBody,
      metadata: { permitId: p.id, gateId: gate },
    },
  });

  // Fire-and-forget Web Push (non-blocking)
  sendPushToUser(prisma, p.resident.userId, {
    title: notifTitle,
    body: notifBody,
    tag: `visitor-arrival-${p.id}`,
    data: { url: `/resident/permits/${p.id}`, permitId: p.id },
  }).catch(() => {});

  await prisma.auditLog.create({
    data: {
      userId: u.id,
      guardId: u.guard.id,
      action: 'GRANT_ENTRY',
      targetType: 'Permit',
      targetId: p.id,
      gateId: gate,
    },
  });

  return NextResponse.json({ ok: true, visit });
}
