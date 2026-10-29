import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { badRequest, requireAdmin, unauthorized } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const schema = z.object({ current: z.string().min(1).max(200), next: z.string().min(10, 'A nova senha precisa ter pelo menos 10 caracteres').max(200) });

export async function PUT(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();
  if (!rateLimit(`pwd:${admin.id}`, 5, 15 * 60_000).ok) return badRequest('Muitas tentativas. Aguarde.', 429);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Dados inválidos');
  const full = await db.admin.findUnique({ where: { id: admin.id } });
  if (!full || !(await bcrypt.compare(parsed.data.current, full.passwordHash))) return badRequest('Senha atual incorreta');
  await db.admin.update({ where: { id: admin.id }, data: { passwordHash: await bcrypt.hash(parsed.data.next, 12) } });
  return NextResponse.json({ ok: true });
}
