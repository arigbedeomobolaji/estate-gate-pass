// Pure date/permit logic — safe to import in both server and client components

export function validTimeWindow(
  date: string,
  start: string,
  end: string,
  now = new Date(),
  endDate?: string,
): string {
  const today = now.toISOString().slice(0, 10);
  const rangeEnd = endDate || date;
  if (today < date) return 'NOT_YET_VALID';
  if (today > rangeEnd) return 'EXPIRED';
  const m = now.getHours() * 60 + now.getMinutes();
  const s = Number(start.slice(0, 2)) * 60 + Number(start.slice(3));
  const e = Number(end.slice(0, 2)) * 60 + Number(end.slice(3));
  return m < s ? 'NOT_YET_VALID' : m > e ? 'EXPIRED' : 'VALID';
}

export function calcPermitCategory(
  visitDate: string,
  visitEndDate: string | null,
  maxFreeDays: number,
  chargePerDay: number,
): { days: number; category: 'STANDARD' | 'EXTENDED'; chargeAmount: number } {
  const start = new Date(visitDate);
  const end = visitEndDate ? new Date(visitEndDate) : new Date(visitDate);
  const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (days <= maxFreeDays) return { days, category: 'STANDARD', chargeAmount: 0 };
  const excessDays = days - maxFreeDays;
  return { days, category: 'EXTENDED', chargeAmount: excessDays * chargePerDay };
}
