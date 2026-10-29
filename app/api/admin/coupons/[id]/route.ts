import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { badRequest, requireAdmin, unauthorized } from '@/lib/auth';
import { fromLocalInput } from '@/lib/format';
import { prismaError } from '@/lib/product-helpers';
import { couponSchema, firstError } from '@/lib/validators';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await params;
  const parsed = couponSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(firstError(parsed.error));
  try {
    await db.coupon.update({
      where: { id },
      data: { ...parsed.data, usageLimit: parsed.data.usageLimit ?? null, expiresAt: fromLocalInput(parsed.data.expiresAt, true) },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return prismaError(e, 'Já existe um cupom com esse código');
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();
  await db.coupon.delete({ where: { id: (await params).id } });
  return NextResponse.json({ ok: true });
}
