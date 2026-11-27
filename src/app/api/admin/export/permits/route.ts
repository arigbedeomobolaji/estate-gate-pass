import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

function esc(v: string) {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export async function GET(req: Request) {
  const u = await getSession();
  if (!u || u.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const status = searchParams.get('status') ?? '';
  const dateFrom = searchParams.get('from') ?? '';
  const dateTo = searchParams.get('to') ?? '';

  const { prisma } = await import('@/lib/prisma');

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (dateFrom || dateTo) {
    const range: Record<string, Date> = {};
    if (dateFrom) range.gte = new Date(dateFrom + 'T00:00:00Z');
    if (dateTo) range.lte = new Date(dateTo + 'T23:59:59Z');
    where.visitDate = range;
  }
  if (q) {
    where.OR = [
      { permitNumber: { contains: q, mode: 'insensitive' } },
      { visitor: { fullName: { contains: q, mode: 'insensitive' } } },
      { visitor: { phone: { contains: q, mode: 'insensitive' } } },
      { resident: { user: { fullName: { contains: q, mode: 'insensitive' } } } },
      { resident: { houseNumber: { contains: q, mode: 'insensitive' } } },
      { vehicleRegistration: { contains: q, mode: 'insensitive' } },
    ];
  }

  const permits = await prisma.permit.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 10000,
    include: {
      visitor: true,
      resident: { include: { user: { select: { fullName: true } } } },
      visit: { include: { entryGate: { select: { name: true } }, exitGate: { select: { name: true } } } },
    },
  });

  const headers = [
    'Permit No', 'Category', 'Permit Status', 'Visitor Name', 'Visitor Phone',
    'Resident Name', 'House No', 'Purpose', 'Visit Date', 'Visit End Date',
    'Entry Time (UTC)', 'Exit Time (UTC)', 'Entry Gate', 'Exit Gate',
    'Visit Status', 'Charge Amount', 'Charge Status', 'Vehicle Reg', 'Created At (UTC)',
  ];

  const rows = permits.map(p => [
    p.permitNumber,
    p.permitCategory,
    p.status,
    p.visitor.fullName,
    p.visitor.phone,
    p.resident.user.fullName,
    p.resident.houseNumber,
    p.purpose,
    p.visitDate.toISOString().slice(0, 10),
    p.visitEndDate?.toISOString().slice(0, 10) ?? '',
    p.visit?.entryAt?.toISOString() ?? '',
    p.visit?.exitAt?.toISOString() ?? '',
    p.visit?.entryGate?.name ?? '',
    p.visit?.exitGate?.name ?? '',
    p.visit?.status ?? 'EXPECTED',
    p.chargeAmount?.toString() ?? '',
    p.chargeStatus ?? '',
    p.vehicleRegistration ?? '',
    p.createdAt.toISOString(),
  ].map(esc).join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  const filename = `permits-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
