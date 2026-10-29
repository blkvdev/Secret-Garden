import { db } from './db';
import { round2 } from './format';

export type ActivePromo = { id: string; name: string; type: string; value: number; allProducts: boolean; productIds: Set<string> };

export async function getActivePromotions(): Promise<ActivePromo[]> {
  const now = new Date();
  const promos = await db.promotion.findMany({
    where: { active: true, startsAt: { lte: now }, endsAt: { gte: now } },
    include: { products: { select: { id: true } } },
  });
  return promos.map((p) => ({ id: p.id, name: p.name, type: p.type, value: p.value, allProducts: p.allProducts, productIds: new Set(p.products.map((x) => x.id)) }));
}

/** Menor preço entre: preço normal, preço promocional do produto e promoções ativas. */
export function priceFor(p: { id: string; price: number; promoPrice: number | null }, promos: ActivePromo[]) {
  let final = p.price;
  let promoName: string | null = null;
  if (p.promoPrice != null && p.promoPrice > 0 && p.promoPrice < final) {
    final = p.promoPrice;
    promoName = 'Oferta';
  }
  for (const promo of promos) {
    if (!promo.allProducts && !promo.productIds.has(p.id)) continue;
    const v = promo.type === 'PERCENT' ? p.price * (1 - promo.value / 100) : p.price - promo.value;
    const candidate = Math.max(0.01, round2(v));
    if (candidate < final) {
      final = candidate;
      promoName = promo.name;
    }
  }
  final = round2(final);
  return { finalPrice: final, onSale: final < p.price, promoName };
}

export async function withPrices<T extends { id: string; price: number; promoPrice: number | null }>(products: T[]) {
  const promos = await getActivePromotions();
  return products.map((p) => ({ ...p, ...priceFor(p, promos) }));
}

export function couponDiscount(c: { type: string; value: number }, subtotal: number) {
  const d = c.type === 'PERCENT' ? subtotal * (c.value / 100) : c.value;
  return round2(Math.min(subtotal, Math.max(0, d)));
}

export function couponProblem(
  c: { active: boolean; expiresAt: Date | null; usageLimit: number | null; used: number; minValue: number } | null,
  subtotal: number,
) {
  if (!c || !c.active) return 'Cupom inválido';
  if (c.expiresAt && c.expiresAt < new Date()) return 'Este cupom expirou';
  if (c.usageLimit != null && c.used >= c.usageLimit) return 'Este cupom já atingiu o limite de uso';
  if (subtotal < c.minValue) return `Este cupom vale para compras a partir de R$ ${c.minValue.toFixed(2).replace('.', ',')}`;
  return null;
}
