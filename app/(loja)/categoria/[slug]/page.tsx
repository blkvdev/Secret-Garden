import { notFound } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import SectionTitle from '@/components/SectionTitle';
import { db } from '@/lib/db';
import { withPrices } from '@/lib/pricing';
import { productInclude } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await db.category.findUnique({ where: { slug } });
  if (!category || !category.active) notFound();
  const products = await withPrices(await db.product.findMany({ where: { categoryId: category.id, active: true }, include: productInclude, orderBy: { name: 'asc' } }));
  products.sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0)); // esgotados por último

  return (
    <section className="section">
      <div className="container">
        <SectionTitle as="h1" caps={category.name} sub={`${products.length} produto(s)`} />
        {products.length === 0 ? <p className="center muted">Em breve novos produtos por aqui </p> : <div className="grid">{products.map((p) => <ProductCard key={p.id} p={p} />)}</div>}
      </div>
    </section>
  );
}
