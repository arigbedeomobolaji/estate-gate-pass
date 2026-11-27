import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';

const createSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  role: z.enum(['RESIDENT', 'GUARD', 'ADMIN']),
  userType: z.enum(['PERSONNEL', 'CIVILIAN']).default('PERSONNEL'),
  serviceNumber: z.string().max(50).optional(),
  houseNumber: z.string().max(60).optional(),
  phone: z.string().max(20).optional(),
  assignedGateId: z.string().optional(),
});

export async function GET() {
  const u = await getSession();
  if (!u || u.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { prisma } = await import('@/lib/prisma');
  const users = await prisma.user.findMany({
    select: {
      id: true, email: true, fullName: true, role: true, userType: true,
      serviceNumber: true, mustChangePassword: true, active: true,
      createdAt: true,
      resident: { select: { id: true, houseNumber: true, phone: true } },
      guard: { select: { id: true, assignedGateId: true, assignedGate: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const u = await getSession();
  if (!u || u.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const input = createSchema.parse(await req.json());

    if (input.role === 'RESIDENT') {
      if (!input.houseNumber) return NextResponse.json({ error: 'House number is required for residents' }, { status: 400 });
      if (!input.phone) return NextResponse.json({ error: 'Phone is required for residents' }, { status: 400 });
    }
    if (input.userType === 'PERSONNEL' && !input.serviceNumber) {
      return NextResponse.json({ error: 'Service number is required for PERSONNEL' }, { status: 400 });
    }

    const { prisma } = await import('@/lib/prisma');
    const bcrypt = (await import('bcryptjs')).default;
    const crypto = (await import('node:crypto')).default;

    const tempPassword = crypto.randomBytes(5).toString('hex').toUpperCase();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        role: input.role,
        fullName: input.fullName,
        userType: input.userType,
        serviceNumber: input.serviceNumber || null,
        mustChangePassword: true,
        ...(input.role === 'RESIDENT' && {
          resident: { create: { houseNumber: input.houseNumber!, phone: input.phone! } },
        }),
        ...(input.role === 'GUARD' && {
          guard: { create: { assignedGateId: input.assignedGateId || null } },
        }),
      },
      select: {
        id: true, email: true, fullName: true, role: true, userType: true,
        serviceNumber: true, mustChangePassword: true, active: true, createdAt: true,
        resident: { select: { id: true, houseNumber: true, phone: true } },
        guard: { select: { id: true, assignedGateId: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: u.id,
        action: 'CREATE_USER',
        targetType: 'User',
        targetId: user.id,
        metadata: { role: user.role, email: user.email },
      },
    });

    return NextResponse.json({ user, tempPassword }, { status: 201 });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      const field = e.meta?.target?.[0];
      return NextResponse.json(
        { error: field === 'serviceNumber' ? 'Service number already in use' : 'Email address already in use' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unable to create user' }, { status: 400 });
  }
}
