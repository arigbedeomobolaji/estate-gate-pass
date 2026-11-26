interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  icon?: React.ReactNode;
}

export default function StatCard({ label, value, sub, accent, icon }: StatCardProps) {
  if (accent) {
    return (
      <div className="rounded-2xl p-5 shadow-sm flex flex-col gap-3" style={{ background: 'var(--sidebar)', border: '1px solid oklch(1 0 0 / 0.1)' }}>
        {icon && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white" style={{ background: 'oklch(1 0 0 / 0.15)' }}>
            {icon}
          </div>
        )}
        <div>
          <div className="text-3xl font-bold tracking-tight text-white">{value}</div>
          <div className="text-xs font-semibold uppercase tracking-widest mt-1" style={{ color: 'oklch(1 0 0 / 0.5)' }}>{label}</div>
          {sub && <div className="text-xs mt-0.5" style={{ color: 'oklch(1 0 0 / 0.4)' }}>{sub}</div>}
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-2xl p-5 shadow-sm bg-white flex flex-col gap-3" style={{ border: '1px solid var(--border)' }}>
      {icon && (
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'oklch(0.38 0.28 265 / 0.1)', color: 'var(--afit-navy)' }}>
          {icon}
        </div>
      )}
      <div>
        <div className="text-3xl font-bold tracking-tight" style={{ color: 'var(--afit-navy)' }}>{value}</div>
        <div className="text-xs font-semibold uppercase tracking-widest mt-1" style={{ color: 'var(--muted-foreground)' }}>{label}</div>
        {sub && <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{sub}</div>}
      </div>
    </div>
  );
}
