import Link from 'next/link';
import HeroCarousel from '@/components/HeroCarousel';
import ProductCard from '@/components/ProductCard';
import SectionTitle from '@/components/SectionTitle';
import Strip from '@/components/Strip';
import { db } from '@/lib/db';
import { withPrices } from '@/lib/pricing';
import { getBanners, getSettings, productInclude, visible } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [s, top, middle, raw] = await Promise.all([
    getSettings(),
    getBanners('TOPO'),
    getBanners('MEIO'),
    db.product.findMany({ where: visible, include: productInclude, orderBy: { updatedAt: 'desc' } }),
  ]);
  const all = await withPrices(raw);
  const featured = all.filter((p) => p.featured).slice(0, 8);
  const best = all.filter((p) => p.bestSeller).slice(0, 8);
  const promos = all.filter((p) => p.onSale).slice(0, 8);
  const novos = [...all].filter((p) => p.isNew).sort((a, b) => +b.createdAt - +a.createdAt).slice(0, 4);
  const buques = all.filter((p) => p.category.slug === 'buques').slice(0, 4);

  return (
    <>
      {top.length > 0 ? (
        <HeroCarousel slides={top} />
      ) : (
        <section className="hero">
          <div className="hero-default">
            <img className="logo-big" src="/logo-original.jpg" alt={s.storeName} />
            <div className="txt">
              <h1>{s.heroTitle}</h1>
              {s.heroSubtitle && <p>{s.heroSubtitle}</p>}
              <Link href="/categoria/buques" className="btn">Ver buquês</Link>
            </div>
          </div>
        </section>
      )}

      <div className="container perks">
        <div className="perk"><span>🌸</span>Flores frescas</div>
        <div className="perk"><span>🚚</span>Entrega na região</div>
        <div className="perk"><span>💬</span>Pedido pelo WhatsApp</div>
        <div className="perk"><span>💳</span>PIX, dinheiro ou cartão</div>
      </div>

      {featured.length > 0 && (
        <section className="section">
          <div className="container">
            <SectionTitle caps="Flores" script="únicas" sub="Uma flor, mil significados — encontre a ideal para o seu momento." />
            <div className="grid">{featured.map((p) => <ProductCard key={p.id} p={p} />)}</div>
          </div>
        </section>
      )}

      {best.length > 0 && (
        <section className="section section-alt">
          <div className="container">
            <SectionTitle caps="Mais" script="pedidos" sub="Os favoritos dos nossos clientes" />
            <div className="grid">{best.map((p) => <ProductCard key={p.id} p={p} />)}</div>
          </div>
        </section>
      )}

      {middle[0] && <Strip b={middle[0]} />}

      {promos.length > 0 && (
        <section className="section">
          <div className="container">
            <SectionTitle caps="Promoções" script="especiais" sub="Aproveite enquanto durar o estoque" />
            <div className="grid">{promos.map((p) => <ProductCard key={p.id} p={p} />)}</div>
            <p className="center" style={{ marginTop: 34 }}><Link href="/promocoes" className="btn btn-outline">Ver todas as promoções</Link></p>
          </div>
        </section>
      )}

      {buques.length > 0 && (
        <section className="section section-alt">
          <div className="container">
            <SectionTitle caps="Buquês" script="encantadores" sub="Para dizer tudo sem dizer nada" />
            <div className="grid">{buques.map((p) => <ProductCard key={p.id} p={p} />)}</div>
            <p className="center" style={{ marginTop: 34 }}><Link href="/categoria/buques" className="btn btn-outline">Ver todos os buquês</Link></p>
          </div>
        </section>
      )}

      {middle.slice(1).map((b) => <Strip key={b.id} b={b} />)}

      {novos.length > 0 && (
        <section className="section">
          <div className="container">
            <SectionTitle caps="Novidades" script="no jardim" sub="Acabaram de chegar" />
            <div className="grid">{novos.map((p) => <ProductCard key={p.id} p={p} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}
