const STATUS_STYLES: Record<string, string> = {
  APPROVED: 'bg-blue-100 text-blue-800 border-blue-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
  EXPECTED: 'bg-amber-100 text-amber-700 border-amber-200',
  INSIDE: 'bg-green-100 text-green-700 border-green-200',
  EXITED: 'bg-slate-100 text-slate-600 border-slate-200',
  DENIED: 'bg-red-100 text-red-700 border-red-200',
  STANDARD: 'bg-blue-100 text-blue-800 border-blue-200',
  EXTENDED: 'bg-amber-100 text-amber-700 border-amber-200',
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  INACTIVE: 'bg-slate-100 text-slate-500 border-slate-200',
  ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
  GUARD: 'bg-sky-100 text-sky-700 border-sky-200',
  RESIDENT: 'bg-teal-100 text-teal-700 border-teal-200',
  VALID: 'bg-green-100 text-green-700 border-green-200',
  NOT_YET_VALID: 'bg-amber-100 text-amber-700 border-amber-200',
  EXPIRED: 'bg-slate-100 text-slate-500 border-slate-200',
  PAID: 'bg-green-100 text-green-700 border-green-200',
  UNPAID: 'bg-red-100 text-red-700 border-red-200',
};

export default function Badge({ status, label }: { status: string; label?: string }) {
  const cls = STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {label ?? status.replace(/_/g, ' ')}
    </span>
  );
}
