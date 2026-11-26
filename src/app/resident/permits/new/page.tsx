import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AppShell from '@/components/layout/AppShell';
import PageHeader from '@/components/PageHeader';
import NewPermitClient from './NewPermitClient';

export default async function NewPermit() {
  const u = await getSession();
  if (!u || u.role !== 'RESIDENT') redirect('/login');

  return (
    <AppShell user={u} title="New Permit">
      <PageHeader
        title="Create Visitor Permit"
        description="Approved automatically for registered residents."
        backHref="/resident/permits"
        backLabel="My Permits"
      />
      <NewPermitClient />
    </AppShell>
  );
}
