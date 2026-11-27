import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

type RowResult = { row: number; name: string; error: string };

export async function POST(req: Request) {
  const u = await getSession();
  if (!u || u.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  let rows: Record<string, string>[] = [];

  if (name.endsWith('.csv')) {
    rows = parseCSV(buffer.toString('utf-8'));
  } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const XLSX = await import('xlsx');
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as Record<string, string>[];
  } else {
    return NextResponse.json({ error: 'Only CSV or Excel (.xlsx/.xls) files are supported' }, { status: 400 });
  }

  if (rows.length === 0) return NextResponse.json({ error: 'File is empty or has no data rows' }, { status: 400 });
  if (rows.length > 500) return NextResponse.json({ error: 'Maximum 500 rows per import' }, { status: 400 });

  const { prisma } = await import('@/lib/prisma');
  const bcrypt = (await import('bcryptjs')).default;
  const crypto = (await import('node:crypto')).default;

  const created: { name: string; email: string; login: string; tempPassword: string }[] = [];
  const failed: RowResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2; // 1-indexed + header row

    const fullName = String(r.fullName || r['Full Name'] || r.name || '').trim();
    const email = String(r.email || r.Email || '').trim().toLowerCase();
    const houseNumber = String(r.houseNumber || r['House Number'] || r.house || '').trim();
    const phone = String(r.phone || r.Phone || '').trim();
    const userType = String(r.userType || r['User Type'] || 'PERSONNEL').trim().toUpperCase();
    const serviceNumber = String(r.serviceNumber || r['Service Number'] || '').trim() || null;

    if (!fullName) { failed.push({ row: rowNum, name: fullName || `Row ${rowNum}`, error: 'fullName is required' }); continue; }
    if (!email || !email.includes('@')) { failed.push({ row: rowNum, name: fullName, error: 'Valid email is required' }); continue; }
    if (!houseNumber) { failed.push({ row: rowNum, name: fullName, error: 'houseNumber is required' }); continue; }
    if (!phone) { failed.push({ row: rowNum, name: fullName, error: 'phone is required' }); continue; }
    if (!['PERSONNEL', 'CIVILIAN'].includes(userType)) { failed.push({ row: rowNum, name: fullName, error: `userType must be PERSONNEL or CIVILIAN, got "${userType}"` }); continue; }
    if (userType === 'PERSONNEL' && !serviceNumber) { failed.push({ row: rowNum, name: fullName, error: 'serviceNumber is required for PERSONNEL' }); continue; }

    const tempPassword = crypto.randomBytes(5).toString('hex').toUpperCase();

    try {
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: await bcrypt.hash(tempPassword, 12),
          role: 'RESIDENT',
          fullName,
          userType: userType as 'PERSONNEL' | 'CIVILIAN',
          serviceNumber,
          mustChangePassword: true,
          resident: { create: { houseNumber, phone } },
        },
      });
      created.push({ name: fullName, email, login: serviceNumber || email, tempPassword });
      await prisma.auditLog.create({
        data: { userId: u.id, action: 'BULK_CREATE_USERS', targetType: 'User', targetId: user.id },
      });
    } catch (e: any) {
      const isUnique = e?.code === 'P2002';
      const field = e?.meta?.target?.[0];
      failed.push({
        row: rowNum,
        name: fullName,
        error: isUnique
          ? `${field === 'serviceNumber' ? 'Service number' : 'Email'} already exists`
          : 'Database error — skipped',
      });
    }
  }

  return NextResponse.json({ created: created.length, failed, credentials: created });
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = splitCSVLine(lines[0]).map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = splitCSVLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, (vals[i] ?? '').trim()]));
  });
}

function splitCSVLine(line: string): string[] {
  const cols: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQuote = !inQuote; continue; }
    if (c === ',' && !inQuote) { cols.push(cur); cur = ''; continue; }
    cur += c;
  }
  cols.push(cur);
  return cols;
}
