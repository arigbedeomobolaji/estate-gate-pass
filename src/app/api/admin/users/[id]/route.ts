import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';

const schema = z.object({
  action: z.enum(['activate', 'deactivate', 'reset-password']),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getSession();
  if (!u || u.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { action } = schema.parse(await req.json());
  const { prisma } = await import('@/lib/prisma');

  if (action === 'activate' || action === 'deactivate') {
    const active = action === 'activate';
    await prisma.user.update({ where: { id }, data: { active } });
    await prisma.auditLog.create({
      data: { userId: u.id, action: 'DEACTIVATE_USER', targetType: 'User', targetId: id, metadata: { active } },
    });
    return NextResponse.json({ ok: true, active });
  }

  if (action === 'reset-password') {
    const bcrypt = (await import('bcryptjs')).default;
    const crypto = (await import('node:crypto')).default;
    const tempPassword = crypto.randomBytes(5).toString('hex').toUpperCase();
    await prisma.user.update({
      where: { id },
      data: { passwordHash: await bcrypt.hash(tempPassword, 12), mustChangePassword: true },
    });
    await prisma.auditLog.create({
      data: { userId: u.id, action: 'CHANGE_PASSWORD', targetType: 'User', targetId: id, metadata: { reset: true } },
    });
    return NextResponse.json({ ok: true, tempPassword });
  }
}
