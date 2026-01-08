// src/lib/auth.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('auth_session');
  if (!session) return null;
  try {
    return JSON.parse(session.value);
  } catch {
    return null;
  }
}

export async function verifyAuth() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return session;
}