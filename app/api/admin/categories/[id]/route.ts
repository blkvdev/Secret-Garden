import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { badRequest, requireAdmin, unauthorized } from '@/lib/auth';
import { categorySchema, firstError } from '@/lib/validators';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await params;
  const parsed = categorySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(firstError(parsed.error));
  await db.category.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await params;
  const count = await db.product.count({ where: { categoryId: id } });
  if (count > 0) return badRequest(`Essa categoria tem ${count} produto(s). Mova ou exclua os produtos antes.`);
  await db.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
