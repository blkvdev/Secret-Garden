import Link from 'next/link';
import AddToCartButton from './AddToCartButton';
import { brl, mainImage } from '@/lib/format';

export type CardProduct = {
  id: string; name: string; slug: string; price: number; stock: number; isNew: boolean;
  finalPrice: number; onSale: boolean; promoName: string | null;
  images: { url: string; position: number }[];
  category?: { name: string } | null;
};

export default function ProductCard({ p }: { p: CardProduct }) {
  const img = mainImage(p.images);
  return (
    <article className="card">
      <Link href={`/produto/${p.slug}`} className="card-img">
        <img src={img || '/placeholder.svg'} alt={p.name} loading="lazy" />
        <div className="badges">
          {p.onSale && <span className="badge sale">-{Math.round((1 - p.finalPrice / p.price) * 100)}%</span>}
          {p.isNew && <span className="badge">Novo</span>}
          {p.stock <= 0 && <span className="badge gray">Esgotado</span>}
        </div>
      </Link>
      <div className="card-body">
        {p.category && <p className="card-cat">{p.category.name}</p>}
        <Link href={`/produto/${p.slug}`}><h3>{p.name}</h3></Link>
        <div className="price-box">
          {p.onSale && <span className="price-old">{brl(p.price)}</span>}
          <span className="price">{brl(p.finalPrice)}</span>
        </div>
        <AddToCartButton outline block product={{ id: p.id, name: p.name, slug: p.slug, price: p.finalPrice, image: img, stock: p.stock }} />
      </div>
    </article>
  );
}
