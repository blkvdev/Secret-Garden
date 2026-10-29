import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { cookieSecure } from '@/lib/auth';
import { clientIp, rateLimit, resetRateLimit } from '@/lib/rate-limit';
import { SESSION_COOKIE, SESSION_HOURS, signSession } from '@/lib/session';

export const runtime = 'nodejs';

// hash falso: evita descobrir quais e-mails existem pelo tempo de resposta
const DUMMY_HASH = bcrypt.hashSync('senha-inexistente-para-comparacao', 12);
const schema = z.object({ email: z.string().trim().email().max(200), password: z.string().min(1).max(200) });

export async function POST(req: Request) {
  const key = `login:${clientIp(req)}`;
  const rl = rateLimit(key, 5, 15 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: `Muitas tentativas. Tente de novo em ${Math.ceil(rl.retryAfter / 60)} minuto(s).` }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Informe e-mail e senha' }, { status: 400 });

  const admin = await db.admin.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  const valid = await bcrypt.compare(parsed.data.password, admin?.passwordHash ?? DUMMY_HASH);
  if (!admin || !valid) return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 });

  resetRateLimit(key);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await signSession(admin.id), {
    httpOnly: true, secure: cookieSecure(), sameSite: 'strict', path: '/', maxAge: SESSION_HOURS * 3600,
  });
  return res;
}
