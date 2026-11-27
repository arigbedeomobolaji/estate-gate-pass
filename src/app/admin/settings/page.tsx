import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AppShell from '@/components/layout/AppShell';
import PageHeader from '@/components/PageHeader';
import SettingsClient from './SettingsClient';

const DEFAULTS: Record<string, string> = {
  retention_days: '365',
};

export default async function AdminSettings() {
  const u = await getSession();
  if (!u || u.role !== 'ADMIN') redirect('/login');

  const { prisma } = await import('@/lib/prisma');
  const rows = await prisma.systemSetting.findMany();
  const settings: Record<string, string> = { ...DEFAULTS };
  for (const r of rows) settings[r.key] = r.value;

  return (
    <AppShell user={u} title="System Settings">
      <PageHeader
        title="System Settings"
        description="Configure estate-wide operational settings."
        backHref="/admin"
        backLabel="Admin Dashboard"
      />
      <SettingsClient initialSettings={settings} />
    </AppShell>
  );
}
