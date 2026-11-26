import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AppShell from '@/components/layout/AppShell';
import PageHeader from '@/components/PageHeader';
import Badge from '@/components/ui/Badge';
import QRCode from 'qrcode';
import { fetchPermits } from '@/lib/data';

export default async function PermitPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await getSession();
  if (!u || u.role !== 'RESIDENT') redirect('/login');
  const { id } = await params;
  const permits = await fetchPermits(u);
  const p = permits.find(x => x.id === id);
  if (!p) notFound();

  const token = p.qrToken || p.permitNumber;
  const qr = await QRCode.toDataURL(token, { margin: 2, width: 400 });

  const dateRange = p.visitEndDate
    ? `${p.visitDate.slice(0, 10)} – ${p.visitEndDate.slice(0, 10)}`
    : p.visitDate.slice(0, 10);

  const fields = [
    { label: 'Permit No.', value: <span className="font-mono text-xs font-semibold">{p.permitNumber}</span> },
    { label: 'Purpose', value: p.purpose },
    { label: 'Valid date(s)', value: dateRange },
    { label: 'Time window', value: `${p.startTime}–${p.endTime}` },
    { label: 'Visiting', value: `${p.resident.fullName} · House ${p.resident.houseNumber}` },
    { label: 'Vehicle', value: p.vehicleRegistration ? `${p.vehicleRegistration}${p.vehicleType ? ` · ${p.vehicleType}` : ''}` : 'None specified' },
    ...(p.chargeAmount != null && p.chargeAmount > 0
      ? [{ label: 'Charge', value: `NGN ${p.chargeAmount.toLocaleString()} (pending)` }]
      : []),
  ];

  return (
    <AppShell user={u} title="Permit Details">
      <PageHeader
        title={p.visitor.fullName}
        description="Visitor access permit"
        backHref="/resident/permits"
        backLabel="My Permits"
      />

      <div className="max-w-3xl">
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {/* Header strip */}
          <div className="px-6 py-4 flex items-center gap-3" style={{ background: 'var(--sidebar)', borderBottom: '1px solid oklch(1 0 0 / 0.08)' }}>
            {p.visitorPhotoUrl && (
              <img
                src={p.visitorPhotoUrl}
                alt={`Photo of ${p.visitor.fullName}`}
                className="w-12 h-12 rounded-xl object-cover shrink-0"
                style={{ border: '2px solid oklch(1 0 0 / 0.2)' }}
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold text-lg truncate">{p.visitor.fullName}</div>
              <div className="text-sm truncate" style={{ color: 'oklch(1 0 0 / 0.6)' }}>{p.visitor.phone}</div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Badge status={p.status} />
              {p.permitCategory && <Badge status={p.permitCategory} />}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-0 lg:divide-x" style={{ '--tw-divide-opacity': 1 } as any}>
            {/* Permit fields */}
            <div className="flex-1 p-6">
              <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--muted-foreground)' }}>Permit Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fields.map(f => (
                  <div key={f.label}>
                    <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--muted-foreground)' }}>{f.label}</div>
                    <div className="text-sm font-medium">{f.value}</div>
                  </div>
                ))}
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--muted-foreground)' }}>Visit Status</div>
                  <Badge status={p.visit?.status ?? 'EXPECTED'} />
                </div>
              </div>
            </div>

            {/* QR code */}
            <div className="p-6 flex flex-col items-center justify-center gap-3">
              <img
                src={qr}
                alt="Visitor permit QR code"
                className="w-48 h-48 rounded-xl"
                style={{ border: '1px solid var(--border)', padding: 8 }}
              />
              <p className="text-xs text-center" style={{ color: 'var(--muted-foreground)' }}>
                Show this QR code at the gate
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
