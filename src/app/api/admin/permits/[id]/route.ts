import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

const VALID_CHARGE_STATUSES = ['PENDING', 'PAID', 'WAIVED'] as const;
type ChargeStatus = (typeof VALID_CHARGE_STATUSES)[number];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = await getSession();
  if (!u || u.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { chargeStatus } = body as { chargeStatus?: string };

  if (!chargeStatus || !VALID_CHARGE_STATUSES.includes(chargeStatus as ChargeStatus)) {
    return NextResponse.json(
      { error: `chargeStatus must be one of: ${VALID_CHARGE_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  const { prisma } = await import('@/lib/prisma');

  const existing = await prisma.permit.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Permit not found' }, { status: 404 });
  }

  const permit = await prisma.permit.update({
    where: { id },
    data: { chargeStatus: chargeStatus as ChargeStatus },
  });

  await prisma.auditLog.create({
    data: {
      userId: u.id,
      action: 'UPDATE_RESIDENT', // closest general "update" action available in schema enum
      targetType: 'Permit',
      targetId: id,
      metadata: { chargeStatus, event: 'CHARGE_STATUS_UPDATED' },
    },
  });

  return NextResponse.json({ permit });
}
