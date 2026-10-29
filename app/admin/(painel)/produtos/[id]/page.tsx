import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductForm from '@/components/admin/ProductForm';
import StockPanel from '@/components/admin/StockPanel';
import { db } from '@/lib/db';
import { formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ criado?: string }> }) {
  const { id } = await params;
  const { criado } = await searchParams;
  const [p, categories] = await Promise.all([
    db.product.findUnique({ where: { id }, include: { images: { orderBy: { position: 'asc' } }, movements: { orderBy: { createdAt: 'desc' }, take: 50 } } }),
    db.category.findMany({ orderBy: { position: 'asc' }, select: { id: true, name: true } }),
  ]);
  if (!p) notFound();

  return (
    <>
      <div className="page-head">
        <h1>{p.name}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={`/produto/${p.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">Ver no site ↗</a>
          <Link href="/admin/produtos" className="btn btn-outline btn-sm">← Voltar</Link>
        </div>
      </div>
      {criado && <p className="alert alert-ok">Produto cadastrado! Ele já aparece na categoria do site (se estiver ativo).</p>}
      <div className="two-col">
        <ProductForm categories={categories} product={{ ...p, images: p.images.map((i) => i.url) }} />
        <StockPanel productId={p.id} stock={p.stock} minStock={p.minStock} movements={p.movements.map((m) => ({ id: m.id, change: m.change, reason: m.reason, createdAt: formatDate(m.createdAt) }))} />
      </div>
    </>
  );
}
