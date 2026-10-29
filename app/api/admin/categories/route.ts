import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { badRequest, requireAdmin, unauthorized } from '@/lib/auth';
import { slugify } from '@/lib/format';
import { categorySchema, firstError } from '@/lib/validators';

export async function POST(req: Request) {
  if (!(await requireAdmin())) return unauthorized();
  const parsed = categorySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(firstError(parsed.error));
  const slug = slugify(parsed.data.name);
  if (!slug) return badRequest('Nome inválido');
  if (await db.category.findUnique({ where: { slug } })) return badRequest('Essa categoria já existe');
  return NextResponse.json(await db.category.create({ data: { ...parsed.data, slug } }));
}
