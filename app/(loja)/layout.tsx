import Link from 'next/link';
import { CartProvider } from '@/components/CartProvider';
import Header from '@/components/Header';
import { db } from '@/lib/db';
import { getSettings } from '@/lib/store';
import { whatsappLink } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const now = new Date();
  const [s, categories, promoCount, promoProducts] = await Promise.all([
    getSettings(),
    db.category.findMany({ where: { active: true }, orderBy: [{ position: 'asc' }, { name: 'asc' }], select: { name: true, slug: true } }),
    db.promotion.count({ where: { active: true, startsAt: { lte: now }, endsAt: { gte: now } } }),
    db.product.count({ where: { active: true, promoPrice: { not: null } } }),
  ]);
  const logo = s.logoUrl || '/logo.png';

  return (
    <CartProvider>
      <Header storeName={s.storeName} logoUrl={logo} announcement={s.announcement} categories={categories} hasPromos={promoCount + promoProducts > 0} />
      <main>{children}</main>
      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <img src={logo} alt={s.storeName} />
            <p className="muted" style={{ marginTop: 10 }}>Flores, afeto e delicadeza para cada momento.</p>
          </div>
          <div>
            <h4>Loja</h4>
            {categories.map((c) => <p key={c.slug}><Link href={`/categoria/${c.slug}`}>{c.name}</Link></p>)}
            <p><Link href="/contato">Contato</Link></p>
          </div>
          <div>
            <h4>Fale com a gente</h4>
            {s.whatsapp && <p><a href={whatsappLink(s.whatsapp)} target="_blank" rel="noopener noreferrer">WhatsApp</a></p>}
            {s.instagram && <p><a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noopener noreferrer">@{s.instagram}</a></p>}
            {s.phone && <p>{s.phone}</p>}
            {s.hours && <p className="small">{s.hours}</p>}
            {s.address && <p className="small">{s.address}</p>}
          </div>
        </div>
        <p className="copy">© {new Date().getFullYear()} {s.storeName}</p>
      </footer>
    </CartProvider>
  );
}
