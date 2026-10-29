'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

type Slide = { id: string; title: string; subtitle: string; buttonText: string; link: string; imageUrl: string };

function Cta({ s }: { s: Slide }) {
  if (!s.buttonText || !s.link) return null;
  return s.link.startsWith('/') ? (
    <Link href={s.link} className="btn btn-light">{s.buttonText}</Link>
  ) : (
    <a href={s.link} className="btn btn-light" target="_blank" rel="noopener noreferrer">{s.buttonText}</a>
  );
}

// Banner de ponta a ponta com troca automática a cada 6 segundos
export default function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const n = slides.length;
  const go = useCallback((k: number) => setI(((k % n) + n) % n), [n]);

  useEffect(() => {
    if (n < 2) return;
    timer.current = setInterval(() => setI((x) => (x + 1) % n), 6000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [n, i]);

  const touchX = useRef(0);
  return (
    <section
      className="hero"
      aria-roledescription="carrossel"
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - touchX.current; if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1)); }}
    >
      {slides.map((s, k) => {
        const hasText = !!(s.title || s.subtitle || s.buttonText);
        const inner = (
          <div className="container">
            <div className="hero-content">
              {s.subtitle && <p className="kicker">{s.subtitle}</p>}
              {s.title && <h1>{s.title}</h1>}
              <Cta s={s} />
            </div>
          </div>
        );
        return (
          <div key={s.id} className={`hero-slide ${k === i ? 'active' : ''} ${hasText ? '' : 'no-shade'}`} style={{ backgroundImage: `url(${s.imageUrl})` }} aria-hidden={k !== i}>
            {hasText ? inner : s.link ? <Link href={s.link} style={{ position: 'absolute', inset: 0 }} aria-label="Abrir banner" /> : null}
          </div>
        );
      })}
      {n > 1 && (
        <>
          <button className="hero-arrow prev" type="button" onClick={() => go(i - 1)} aria-label="Banner anterior">‹</button>
          <button className="hero-arrow next" type="button" onClick={() => go(i + 1)} aria-label="Próximo banner">›</button>
          <div className="hero-dots">
            {slides.map((s, k) => <button key={s.id} type="button" className={k === i ? 'active' : ''} onClick={() => go(k)} aria-label={`Banner ${k + 1}`} />)}
          </div>
        </>
      )}
    </section>
  );
}
