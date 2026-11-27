import { cn } from '@/lib/utils';

type BadgeProps = { status: string; label?: string; className?: string };

const MAP: Record<string, { cls: string; text: string }> = {
  APPROVED:      { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'Approved' },
  CANCELLED:     { cls: 'bg-red-50 text-red-600 border-red-200', text: 'Cancelled' },
  INSIDE:        { cls: 'bg-blue-50 text-blue-700 border-blue-200', text: 'Inside' },
  EXITED:        { cls: 'bg-slate-100 text-slate-600 border-slate-200', text: 'Exited' },
  EXPECTED:      { cls: 'bg-amber-50 text-amber-700 border-amber-200', text: 'Expected' },
  DENIED:        { cls: 'bg-red-50 text-red-600 border-red-200', text: 'Denied' },
  STANDARD:      { cls: 'bg-sky-50 text-sky-700 border-sky-200', text: 'Standard' },
  EXTENDED:      { cls: 'bg-purple-50 text-purple-700 border-purple-200', text: 'Extended' },
  ACTIVE:        { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'Active' },
  INACTIVE:      { cls: 'bg-slate-100 text-slate-500 border-slate-200', text: 'Inactive' },
  ADMIN:         { cls: 'bg-violet-50 text-violet-700 border-violet-200', text: 'Admin' },
  GUARD:         { cls: 'bg-blue-50 text-blue-700 border-blue-200', text: 'Guard' },
  RESIDENT:      { cls: 'bg-teal-50 text-teal-700 border-teal-200', text: 'Resident' },
  PERSONNEL:     { cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', text: 'Personnel' },
  CIVILIAN:      { cls: 'bg-slate-50 text-slate-600 border-slate-200', text: 'Civilian' },
  VALID:         { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'Valid' },
  EXPIRED:       { cls: 'bg-red-50 text-red-600 border-red-200', text: 'Expired' },
  PENDING:       { cls: 'bg-amber-50 text-amber-700 border-amber-200', text: 'Pending' },
  PAID:          { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'Paid' },
  WAIVED:        { cls: 'bg-slate-50 text-slate-600 border-slate-200', text: 'Waived' },
  NOT_YET_VALID: { cls: 'bg-amber-50 text-amber-700 border-amber-200', text: 'Not Yet Valid' },
  UNPAID:        { cls: 'bg-red-50 text-red-600 border-red-200', text: 'Unpaid' },
};

export default function Badge({ status, label, className }: BadgeProps) {
  const entry = MAP[status?.toUpperCase()] ?? { cls: 'bg-slate-100 text-slate-600 border-slate-200', text: status?.replace(/_/g, ' ') ?? '' };
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-tight', entry.cls, className)}>
      {label ?? entry.text}
    </span>
  );
}
