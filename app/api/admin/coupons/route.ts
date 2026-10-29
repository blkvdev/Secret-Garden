import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { badRequest, requireAdmin, unauthorized } from '@/lib/auth';
import { fromLocalInput } from '@/lib/format';
import { prismaError } from '@/lib/product-helpers';
import { couponSchema, firstError } from '@/lib/validators';

export async function POST(req: Request) {
  if (!(await requireAdmin())) return unauthorized();
  const parsed = couponSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(firstError(parsed.error));
  try {
    const c = await db.coupon.create({
      data: { ...parsed.data, usageLimit: parsed.data.usageLimit ?? null, expiresAt: fromLocalInput(parsed.data.expiresAt, true) },
    });
    return NextResponse.json({ id: c.id });
  } catch (e) {
    return prismaError(e, 'Já existe um cupom com esse código');
  }
}
