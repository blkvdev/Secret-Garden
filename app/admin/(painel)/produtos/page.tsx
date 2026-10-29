import Link from 'next/link';
import { db } from '@/lib/db';
import { brl, mainImage } from '@/lib/format';
import { withPrices } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

type SP = Promise<{ q?: string; cat?: string; st?: string }>;

export default async function ProductsAdmin({ searchParams }: { searchParams: SP }) {
  const { q = '', cat = '', st = '' } = await searchParams;
  const [categories, raw] = await Promise.all([
    db.category.findMany({ orderBy: { position: 'asc' } }),
    db.product.findMany({
      where: {
        ...(q ? { OR: [{ name: { contains: q } }, { sku: { contains: q } }] } : {}),
        ...(cat ? { categoryId: cat } : {}),
        ...(st === 'on' ? { active: true } : st === 'off' ? { active: false } : st === 'out' ? { stock: { lte: 0 } } : {}),
      },
      include: { images: true, category: true },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);
  const products = await withPrices(raw);

  return (
    <>
      <div className="page-head"><h1>Produtos</h1><Link href="/admin/produtos/novo" className="btn">+ Novo produto</Link></div>
      <form className="filters">
        <div className="field"><label>Buscar</label><input name="q" defaultValue={q} placeholder="Nome ou SKU" /></div>
        <div className="field">
          <label>Categoria</label>
          <select name="cat" defaultValue={cat}><option value="">Todas</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </div>
        <div className="field">
          <label>Situação</label>
          <select name="st" defaultValue={st}><option value="">Todas</option><option value="on">Ativos</option><option value="off">Inativos</option><option value="out">Sem estoque</option></select>
        </div>
        <button className="btn btn-outline btn-sm">Filtrar</button>
      </form>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Foto</th><th>Produto</th><th>Categoria</th><th>Preço no site</th><th>Estoque</th><th>Vitrine</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td><img className="thumb" src={mainImage(p.images) || '/placeholder.svg'} alt="" /></td>
                <td><b>{p.name}</b><br /><span className="muted small">{p.sku}</span></td>
                <td>{p.category.name}</td>
                <td>{p.onSale ? (<><span className="price-old">{brl(p.price)}</span><br /><b>{brl(p.finalPrice)}</b><br /><span className="promo-name">{p.promoName}</span></>) : brl(p.price)}</td>
                <td><span className={`status ${p.stock <= 0 ? 'status-CANCELADO' : p.stock <= p.minStock ? 'status-wait' : 'status-on'}`}>{p.stock}</span></td>
                <td className="small">{[p.featured && 'Destaque', p.bestSeller && 'Mais pedido', p.isNew && 'Novidade'].filter(Boolean).join(', ') || '—'}</td>
                <td><span className={`status ${p.active ? 'status-on' : 'status-off'}`}>{p.active ? 'Ativo' : 'Inativo'}</span></td>
                <td><Link className="btn btn-sm btn-outline" href={`/admin/produtos/${p.id}`}>Editar</Link></td>
              </tr>
            ))}
            {!products.length && <tr><td colSpan={8} className="muted">Nenhum produto encontrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
