import { NextResponse } from 'next/server';
import { z } from 'zod';
import { signIn } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { identifier, password } = z.object({
      identifier: z.string().min(1),
      password: z.string().min(1),
    }).parse(await req.json());
    const user = await signIn(identifier, password);
    if (!user) return NextResponse.json({ error: 'Invalid credentials or inactive account' }, { status: 401 });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
