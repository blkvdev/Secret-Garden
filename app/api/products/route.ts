import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mainImage } from '@/lib/format';
import { withPrices } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

// Usado pelo carrinho para atualizar preços/estoque com o que está no banco.
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get('ids') || '').split(',').filter(Boolean).slice(0, 50);
  if (!ids.length) return NextResponse.json({ products: [] });
  const products = await withPrices(await db.product.findMany({ where: { id: { in: ids } }, include: { images: true, category: true } }));
  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id, name: p.name, slug: p.slug, price: p.finalPrice, image: mainImage(p.images), stock: p.stock,
      available: p.active && p.category.active && p.stock > 0,
    })),
  });
}
