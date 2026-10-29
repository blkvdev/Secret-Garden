'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from './CartProvider';

type Props = { storeName: string; logoUrl: string; announcement: string; categories: { name: string; slug: string }[]; hasPromos: boolean };

export default function Header({ storeName, logoUrl, announcement, categories, hasPromos }: Props) {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const left = categories.slice(0, 3);
  const extra = categories.slice(3);

  return (
    <>
      {announcement && <div className="announcement">{announcement}</div>}
      <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container header-top">
          <div className="header-left">
            <button className="menu-btn" aria-label="Abrir menu" aria-expanded={open} onClick={() => setOpen(!open)} type="button">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
            </button>
            {left.map((c) => <Link key={c.slug} href={`/categoria/${c.slug}`} className="nav-link">{c.name}</Link>)}
          </div>
          <Link href="/" className="logo" aria-label={storeName}>
            <img src={logoUrl} alt={storeName} />
          </Link>
          <div className="header-right">
            {extra.map((c) => <Link key={c.slug} href={`/categoria/${c.slug}`} className="nav-link">{c.name}</Link>)}
            {hasPromos && <Link href="/promocoes" className="nav-link">Promoções</Link>}
            <Link href="/contato" className="nav-link">Contato</Link>
            <Link href="/carrinho" className="cart-link" aria-label={`Carrinho com ${count} itens`}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
              </svg>
              {count > 0 && <span className="cart-count">{count}</span>}
            </Link>
          </div>
        </div>
        <nav className={`mobile-nav ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
          {categories.map((c) => <Link key={c.slug} href={`/categoria/${c.slug}`} className="caps small">{c.name}</Link>)}
          {hasPromos && <Link href="/promocoes" className="caps small">Promoções</Link>}
          <Link href="/contato" className="caps small">Contato</Link>
        </nav>
      </header>
    </>
  );
}
