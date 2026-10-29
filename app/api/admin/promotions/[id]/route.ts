import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { badRequest, requireAdmin, unauthorized } from '@/lib/auth';
import { firstError, promotionSchema } from '@/lib/validators';
import { promoData } from '@/lib/admin-data';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await params;
  const parsed = promotionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(firstError(parsed.error));
  try {
    const { data, productIds } = promoData(parsed.data);
    await db.promotion.update({ where: { id }, data: { ...data, products: { set: productIds.map((pid) => ({ id: pid })) } } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return badRequest(e instanceof Error ? e.message : 'Erro');
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();
  await db.promotion.delete({ where: { id: (await params).id } });
  return NextResponse.json({ ok: true });
}
