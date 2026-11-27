import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { createDemoPermit, listDemoPermits } from '@/lib/demo-store';
import { hashToken, makePermitNumber, calcPermitCategory } from '@/lib/permit';

const MAX_PHOTO_BYTES = 300_000; // ~300 KB base64 limit

const schema = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().min(7).max(20),
  purpose: z.string().min(2).max(160),
  visitDate: z.string(),
  visitEndDate: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  vehicleRegistration: z.string().max(30).optional(),
  vehicleType: z.string().max(40).optional(),
  visitorPhotoUrl: z.string().max(MAX_PHOTO_BYTES).optional(),
  chargeAcknowledged: z.boolean().optional(),
});

export async function GET() {
  const u = await getSession();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (process.env.DEMO_MODE === 'true') return NextResponse.json({ permits: listDemoPermits(u) });
  const { prisma } = await import('@/lib/prisma');
  const where = u.role === 'RESIDENT' ? { resident: { userId: u.id } } : {};
  const rows = await prisma.permit.findMany({
    where,
    include: { visitor: true, resident: { include: { user: true } }, visit: { include: { entryGate: true, exitGate: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return NextResponse.json({
    permits: rows.map(p => ({
      ...p,
      qrToken: undefined,
      chargeAmount: p.chargeAmount ? Number(p.chargeAmount) : null,
      resident: { id: p.resident.id, fullName: p.resident.user.fullName, houseNumber: p.resident.houseNumber },
    })),
  });
}

export async function POST(req: Request) {
  const u = await getSession();
  if (!u || u.role !== 'RESIDENT' || !u.resident) {
    return NextResponse.json({ error: 'Residents only' }, { status: 403 });
  }
  try {
    const input = schema.parse(await req.json());

    if (input.startTime >= input.endTime) {
      return NextResponse.json({ error: 'Start time must be before end time' }, { status: 400 });
    }
    if (input.visitEndDate && input.visitEndDate < input.visitDate) {
      return NextResponse.json({ error: 'End date must be on or after the visit date' }, { status: 400 });
    }

    if (process.env.DEMO_MODE === 'true') {
      return NextResponse.json({ permit: createDemoPermit(u, input) }, { status: 201 });
    }

    const { prisma } = await import('@/lib/prisma');

    // Apply permit rule
    const rule = await prisma.permitRule.findFirst({ where: { active: true } });
    const maxFreeDays = rule?.maxFreeDays ?? 30;
    const chargePerDay = Number(rule?.chargePerDay ?? 0);
    const { category, chargeAmount } = calcPermitCategory(
      input.visitDate,
      input.visitEndDate ?? null,
      maxFreeDays,
      chargePerDay,
    );

    if (category === 'EXTENDED' && !input.chargeAcknowledged) {
      return NextResponse.json({ error: 'Charge acknowledgement required for extended permits', category, chargeAmount }, { status: 422 });
    }

    const crypto = (await import('node:crypto')).default;
    const token = crypto.randomBytes(32).toString('base64url');

    const permit = await prisma.permit.create({
      data: {
        permitNumber: makePermitNumber(input.visitDate),
        qrTokenHash: hashToken(token),
        resident: { connect: { id: u.resident.id } },
        visitor: { create: { fullName: input.fullName, phone: input.phone } },
        purpose: input.purpose,
        visitDate: new Date(`${input.visitDate}T00:00:00.000Z`),
        visitEndDate: input.visitEndDate ? new Date(`${input.visitEndDate}T00:00:00.000Z`) : null,
        startTime: input.startTime,
        endTime: input.endTime,
        vehicleRegistration: input.vehicleRegistration || null,
        vehicleType: input.vehicleType || null,
        visitorPhotoUrl: input.visitorPhotoUrl || null,
        permitCategory: category,
        chargeAmount: chargeAmount > 0 ? chargeAmount : null,
        chargeStatus: chargeAmount > 0 ? 'PENDING' : null,
        status: 'APPROVED',
        visit: { create: { status: 'EXPECTED' } },
      },
      include: { visitor: true, resident: { include: { user: true } }, visit: true },
    });

    return NextResponse.json({
      permit: {
        ...permit,
        qrToken: token,
        chargeAmount: permit.chargeAmount ? Number(permit.chargeAmount) : null,
        resident: { id: permit.resident.id, fullName: permit.resident.user.fullName, houseNumber: permit.resident.houseNumber },
      },
    }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unable to create permit' }, { status: 400 });
  }
}
