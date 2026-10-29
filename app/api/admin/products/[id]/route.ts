import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { badRequest, requireAdmin, unauthorized } from '@/lib/auth';
import { prismaError, uniqueSlug } from '@/lib/product-helpers';
import { deleteImageFile } from '@/lib/uploads';
import { firstError, productSchema } from '@/lib/validators';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await params;
  const current = await db.product.findUnique({ where: { id }, include: { images: true } });
  if (!current) return badRequest('Produto não encontrado', 404);
  const parsed = productSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(firstError(parsed.error));
  // estoque NÃO muda aqui (use o painel de estoque, que registra histórico)
  const { images, stock: _ignored, ...data } = parsed.data;
  try {
    await db.$transaction([
      db.productImage.deleteMany({ where: { productId: id } }),
      db.product.update({
        where: { id },
        data: {
          ...data, promoPrice: data.promoPrice ?? null,
          slug: current.name === data.name ? current.slug : await uniqueSlug(data.name, id),
          images: { create: images.map((url, position) => ({ url, position })) },
        },
      }),
    ]);
  } catch (e) {
    return prismaError(e, 'Já existe um produto com esse SKU');
  }
  for (const img of current.images) if (!images.includes(img.url)) await deleteImageFile(img.url);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await params;
  const product = await db.product.findUnique({ where: { id }, include: { images: true } });
  if (!product) return badRequest('Produto não encontrado', 404);
  await db.product.delete({ where: { id } }); // pedidos antigos guardam nome, SKU e preço
  for (const img of product.images) await deleteImageFile(img.url);
  return NextResponse.json({ ok: true });
}
