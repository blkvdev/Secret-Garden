import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from './db';
import { SESSION_COOKIE, verifySession } from './session';

/** Confere o cookie E se o admin ainda existe no banco. */
export async function requireAdmin() {
  const store = await cookies();
  const id = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!id) return null;
  return db.admin.findUnique({ where: { id }, select: { id: true, email: true, name: true } });
}

export const unauthorized = () => NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
export const badRequest = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export function cookieSecure() {
  if (process.env.COOKIE_SECURE) return process.env.COOKIE_SECURE === 'true';
  return process.env.NODE_ENV === 'production';
}
