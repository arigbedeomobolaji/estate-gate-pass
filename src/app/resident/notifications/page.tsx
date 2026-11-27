import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AppShell from '@/components/layout/AppShell';
import PageHeader from '@/components/PageHeader';
import NotificationsClient from './NotificationsClient';

export default async function NotificationsPage() {
  const u = await getSession();
  if (!u || u.role !== 'RESIDENT') redirect('/login');

  return (
    <AppShell user={u} title="Notifications">
      <PageHeader title="Notifications" description="Your visitor alerts and estate messages." />
      <NotificationsClient />
    </AppShell>
  );
}
