import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession, refreshSession } from '@/lib/auth';

export async function POST(req: Request) {
  const u = await getSession();
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { currentPassword, newPassword } = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    }).parse(await req.json());

    const { prisma } = await import('@/lib/prisma');
    const bcrypt = (await import('bcryptjs')).default;

    const db = await prisma.user.findUnique({ where: { id: u.id } });
    if (!db) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (!(await bcrypt.compare(currentPassword, db.passwordHash))) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: u.id },
      data: {
        passwordHash: await bcrypt.hash(newPassword, 12),
        mustChangePassword: false,
        passwordChangedAt: new Date(),
      },
    });

    // Re-issue JWT with mcp: false so the middleware stops redirecting
    const updated = await refreshSession(u.id);
    return NextResponse.json({ ok: true, role: updated?.role ?? u.role });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unable to change password' }, { status: 400 });
  }
}
