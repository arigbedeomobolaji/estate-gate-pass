import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AppShell from '@/components/layout/AppShell';
import GuardClient from './GuardClient';

export default async function Guard() {
  const u = await getSession();
  if (!u || u.role !== 'GUARD') redirect('/login');
  return (
    <AppShell user={u} title="Gate Verification">
      <GuardClient assignedGateId={u.guard?.assignedGateId ?? null} guardName={u.fullName} />
    </AppShell>
  );
}
