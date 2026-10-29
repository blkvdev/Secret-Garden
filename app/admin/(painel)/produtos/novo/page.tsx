import Link from 'next/link';
import ProductForm from '@/components/admin/ProductForm';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function NewProduct() {
  const categories = await db.category.findMany({ orderBy: { position: 'asc' }, select: { id: true, name: true } });
  return (
    <>
      <div className="page-head"><h1>Novo produto</h1><Link href="/admin/produtos" className="btn btn-outline btn-sm">← Voltar</Link></div>
      {categories.length === 0 ? <p className="alert alert-info">Crie uma categoria antes. <Link href="/admin/categorias">Ir para categorias</Link></p> : <ProductForm categories={categories} />}
    </>
  );
}
