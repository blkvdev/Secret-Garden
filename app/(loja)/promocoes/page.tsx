import ProductCard from '@/components/ProductCard';
import SectionTitle from '@/components/SectionTitle';
import { db } from '@/lib/db';
import { withPrices } from '@/lib/pricing';
import { productInclude, visible } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function PromosPage() {
  const all = await withPrices(await db.product.findMany({ where: visible, include: productInclude }));
  const promos = all.filter((p) => p.onSale);
  return (
    <section className="section">
      <div className="container">
        <SectionTitle as="h1" caps="Promoções" script="especiais" sub={`${promos.length} produto(s) com desconto`} />
        {promos.length === 0 ? <p className="center muted">Nenhuma promoção no momento. Volte em breve 🌷</p> : <div className="grid">{promos.map((p) => <ProductCard key={p.id} p={p} />)}</div>}
      </div>
    </section>
  );
}
