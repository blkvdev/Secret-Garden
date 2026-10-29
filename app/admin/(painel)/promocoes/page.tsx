import PromotionManager from '@/components/admin/PromotionManager';
import { db } from '@/lib/db';
import { toLocalInput } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function PromotionsPage() {
  const now = new Date();
  const [promos, products] = await Promise.all([
    db.promotion.findMany({ include: { products: { select: { id: true } } }, orderBy: { startsAt: 'desc' } }),
    db.product.findMany({ where: { active: true }, include: { category: true }, orderBy: { name: 'asc' } }),
  ]);
  return (
    <PromotionManager
      products={products.map((p) => ({ id: p.id, name: p.name, price: p.price, category: p.category.name }))}
      promos={promos.map((p) => ({
        id: p.id, name: p.name, type: p.type, value: p.value, active: p.active, allProducts: p.allProducts,
        startsAt: toLocalInput(p.startsAt), endsAt: toLocalInput(p.endsAt), productIds: p.products.map((x) => x.id),
        state: !p.active ? 'off' : p.endsAt < now ? 'ended' : p.startsAt > now ? 'scheduled' : 'live',
      }))}
    />
  );
}
