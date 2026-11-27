import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  const u = await getSession();
  if (!u || u.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || '';
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const take = 50;

  const { prisma } = await import('@/lib/prisma');
  const where: any = {};
  if (action) where.action = action;

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { fullName: true, role: true } },
        guard: { select: { user: { select: { fullName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * take,
      take,
    }),
  ]);

  return NextResponse.json({ logs, total, page, pages: Math.ceil(total / take) });
}
