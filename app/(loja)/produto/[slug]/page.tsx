import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BuyBox, Gallery } from '@/components/ProductBuyBox';
import ProductCard from '@/components/ProductCard';
import SectionTitle from '@/components/SectionTitle';
import { db } from '@/lib/db';
import { brl, mainImage } from '@/lib/format';
import { withPrices } from '@/lib/pricing';
import { productInclude } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const raw = await db.product.findUnique({ where: { slug }, include: productInclude });
  if (!raw || !raw.active) notFound();
  const [p] = await withPrices([raw]);
  const related = await withPrices(await db.product.findMany({ where: { categoryId: p.categoryId, active: true, id: { not: p.id } }, include: productInclude, take: 4 }));

  return (
    <div className="container">
      <p className="breadcrumb"><Link href="/">Início</Link> / <Link href={`/categoria/${p.category.slug}`}>{p.category.name}</Link> / {p.name}</p>
      <div className="product-page">
        <Gallery images={p.images.map((i) => i.url)} name={p.name} />
        <div className="product-info">
          <p className="card-cat">{p.category.name}</p>
          <h1>{p.name}</h1>
          <div className="price-box">
            {p.onSale && <span className="price-old">{brl(p.price)}</span>}
            <span className="price">{brl(p.finalPrice)}</span>
            {p.onSale && p.promoName && <span className="promo-name">{p.promoName}</span>}
          </div>
          <BuyBox product={{ id: p.id, name: p.name, slug: p.slug, price: p.finalPrice, image: mainImage(p.images), stock: p.stock }} />
          <p className="muted small">{p.stock > 0 ? (p.stock <= p.minStock ? `Últimas ${p.stock} unidade(s)!` : 'Disponível para entrega') : 'Produto esgotado no momento'}</p>
          <div style={{ whiteSpace: 'pre-line' }}>{p.description}</div>
          <p className="muted small">Código: {p.sku}</p>
        </div>
      </div>
      {related.length > 0 && (
        <section className="section" style={{ paddingTop: 20 }}>
          <SectionTitle caps="Você também" script="vai amar" />
          <div className="grid">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div>
        </section>
      )}
    </div>
  );
}
