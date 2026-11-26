import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AppShell from '@/components/layout/AppShell';
import PageHeader from '@/components/PageHeader';
import AdminUsersClient from './AdminUsersClient';

export default async function AdminUsers() {
  const u = await getSession();
  if (!u || u.role !== 'ADMIN') redirect('/login');

  const { prisma } = await import('@/lib/prisma');
  const [users, gates] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true, email: true, fullName: true, role: true, userType: true,
        serviceNumber: true, mustChangePassword: true, active: true, createdAt: true,
        resident: { select: { id: true, houseNumber: true, phone: true } },
        guard: { select: { id: true, assignedGateId: true, assignedGate: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.gate.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);

  return (
    <AppShell user={u} title="User Management">
      <PageHeader
        title="Users & Accounts"
        description="Provision accounts for residents, guards, and administrators."
        backHref="/admin"
        backLabel="Admin Dashboard"
      />
      <AdminUsersClient initialUsers={users as any} gates={gates} />
    </AppShell>
  );
}
