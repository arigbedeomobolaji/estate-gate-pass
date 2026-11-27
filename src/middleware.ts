import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'development-only-secret-change-me');

const EXEMPT_PREFIXES = [
  '/login',
  '/change-password',
  '/api/auth/',
  '/_next/',
  '/favicon.ico',
  '/manifest.webmanifest',
  '/sw.js',
  '/icons/',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === '/') return NextResponse.next();
  if (EXEMPT_PREFIXES.some(p => pathname.startsWith(p))) return NextResponse.next();

  const token = req.cookies.get('estate_session')?.value;
  if (!token) return NextResponse.next(); // page-level guards handle unauthenticated access

  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.mcp === true) {
      return NextResponse.redirect(new URL('/change-password', req.url));
    }
  } catch {
    // expired / invalid token — page-level guards will redirect to /login
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
