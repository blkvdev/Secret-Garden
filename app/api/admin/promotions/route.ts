import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { badRequest, requireAdmin, unauthorized } from '@/lib/auth';
import { promoData } from '@/lib/admin-data';
import { firstError, promotionSchema } from '@/lib/validators';

export async function POST(req: Request) {
  if (!(await requireAdmin())) return unauthorized();
  const parsed = promotionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(firstError(parsed.error));
  try {
    const { data, productIds } = promoData(parsed.data);
    const p = await db.promotion.create({ data: { ...data, products: { connect: productIds.map((id) => ({ id })) } } });
    return NextResponse.json({ id: p.id });
  } catch (e) {
    return badRequest(e instanceof Error ? e.message : 'Erro');
  }
}
