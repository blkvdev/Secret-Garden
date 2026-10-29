import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { badRequest, requireAdmin, unauthorized } from '@/lib/auth';
import { deleteImageFile } from '@/lib/uploads';
import { bannerSchema, firstError } from '@/lib/validators';
import { bannerData } from '@/lib/admin-data';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await params;
  const old = await db.banner.findUnique({ where: { id } });
  if (!old) return badRequest('Banner não encontrado', 404);
  const parsed = bannerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(firstError(parsed.error));
  try {
    await db.banner.update({ where: { id }, data: bannerData(parsed.data) });
  } catch (e) {
    return badRequest(e instanceof Error ? e.message : 'Erro');
  }
  if (old.imageUrl !== parsed.data.imageUrl) await deleteImageFile(old.imageUrl);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await params;
  const old = await db.banner.findUnique({ where: { id } });
  if (!old) return badRequest('Banner não encontrado', 404);
  await db.banner.delete({ where: { id } });
  await deleteImageFile(old.imageUrl);
  return NextResponse.json({ ok: true });
}
