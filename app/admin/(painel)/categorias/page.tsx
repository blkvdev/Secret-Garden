import CategoryManager from '@/components/admin/CategoryManager';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const cats = await db.category.findMany({ orderBy: [{ position: 'asc' }, { name: 'asc' }], include: { _count: { select: { products: true } } } });
  return (
    <>
      <h1>Categorias</h1>
      <p className="muted">As categorias ativas aparecem automaticamente no menu do site (as 3 primeiras à esquerda da logo).</p>
      <CategoryManager categories={cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug, position: c.position, active: c.active, count: c._count.products }))} />
    </>
  );
}
