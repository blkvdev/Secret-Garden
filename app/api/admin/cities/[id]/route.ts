import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { badRequest, requireAdmin, unauthorized } from '@/lib/auth';
import { prismaError } from '@/lib/product-helpers';
import { citySchema, firstError } from '@/lib/validators';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await params;
  const parsed = citySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(firstError(parsed.error));
  try {
    await db.deliveryCity.update({ where: { id }, data: parsed.data });
  } catch (e) {
    return prismaError(e, 'Cidade já cadastrada');
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();
  await db.deliveryCity.delete({ where: { id: (await params).id } });
  return NextResponse.json({ ok: true });
}
