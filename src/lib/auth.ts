import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { demoLogin, getDemoUser } from './demo-store';
import type { User } from './types';

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'development-only-secret-change-me');
const COOKIE = 'estate_session';

export async function signIn(identifier: string, password: string): Promise<User | null> {
  if (process.env.DEMO_MODE === 'true') {
    const u = demoLogin(identifier, password);
    if (!u) return null;
    return issue(u);
  }
  const { prisma } = await import('./prisma');
  const bcrypt = (await import('bcryptjs')).default;
  const db = await prisma.user.findFirst({
    where: { OR: [{ email: identifier.toLowerCase() }, { serviceNumber: identifier.toUpperCase() }] },
    include: { resident: true, guard: true },
  });
  if (!db || !db.active || !(await bcrypt.compare(password, db.passwordHash))) return null;
  return issue(dbToUser(db));
}

export async function refreshSession(userId: string): Promise<User | null> {
  const { prisma } = await import('./prisma');
  const db = await prisma.user.findUnique({ where: { id: userId }, include: { resident: true, guard: true } });
  if (!db || !db.active) return null;
  return issue(dbToUser(db));
}

async function issue(user: User): Promise<User> {
  const token = await new SignJWT({ uid: user.id, role: user.role, mcp: user.mustChangePassword })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
  return user;
}

function dbToUser(db: any): User {
  return {
    id: db.id,
    email: db.email,
    fullName: db.fullName,
    role: db.role as User['role'],
    userType: db.userType as User['userType'],
    serviceNumber: db.serviceNumber || undefined,
    mustChangePassword: db.mustChangePassword,
    active: db.active,
    resident: db.resident
      ? { id: db.resident.id, houseNumber: db.resident.houseNumber, phone: db.resident.phone }
      : undefined,
    guard: db.guard
      ? { id: db.guard.id, assignedGateId: db.guard.assignedGateId || undefined }
      : undefined,
  };
}

export async function getSession(): Promise<User | null> {
  try {
    const token = (await cookies()).get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret);
    const uid = String(payload.uid);
    if (process.env.DEMO_MODE === 'true') return getDemoUser(uid);
    const { prisma } = await import('./prisma');
    const db = await prisma.user.findUnique({ where: { id: uid }, include: { resident: true, guard: true } });
    if (!db || !db.active) return null;
    return dbToUser(db);
  } catch {
    return null;
  }
}

export async function signOut() {
  (await cookies()).delete(COOKIE);
}

export function requireRole(user: User | null, roles: User['role'][]) {
  return !!user && roles.includes(user.role);
}
