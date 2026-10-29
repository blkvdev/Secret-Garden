import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { badRequest, requireAdmin, unauthorized } from '@/lib/auth';
import { prismaError, uniqueSlug } from '@/lib/product-helpers';
import { firstError, productSchema } from '@/lib/validators';

export async function POST(req: Request) {
  if (!(await requireAdmin())) return unauthorized();
  const parsed = productSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(firstError(parsed.error));
  const { images, stock = 0, ...data } = parsed.data;
  try {
    const product = await db.product.create({
      data: {
        ...data, promoPrice: data.promoPrice ?? null, stock, slug: await uniqueSlug(data.name),
        images: { create: images.map((url, position) => ({ url, position })) },
        movements: stock > 0 ? { create: { change: stock, reason: 'Estoque inicial' } } : undefined,
      },
    });
    return NextResponse.json({ id: product.id });
  } catch (e) {
    return prismaError(e, 'Já existe um produto com esse SKU');
  }
}
