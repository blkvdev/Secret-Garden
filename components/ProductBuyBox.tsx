'use client';

import { useState } from 'react';
import AddToCartButton from './AddToCartButton';
import type { CartProduct } from './CartProvider';

export function Gallery({ images, name }: { images: string[]; name: string }) {
  const list = images.length ? images : ['/placeholder.svg'];
  const [current, setCurrent] = useState(0);
  return (
    <div>
      <div className="gallery-main"><img src={list[current]} alt={name} /></div>
      {list.length > 1 && (
        <div className="thumbs">
          {list.map((url, i) => (
            <button key={url} type="button" className={i === current ? 'active' : ''} onClick={() => setCurrent(i)} aria-label={`Foto ${i + 1}`}>
              <img src={url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function BuyBox({ product }: { product: CartProduct }) {
  const [qty, setQty] = useState(1);
  const max = Math.max(1, product.stock);
  if (product.stock <= 0) return <div className="buy-row"><AddToCartButton product={product} /></div>;
  return (
    <div className="buy-row">
      <div className="qty">
        <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Diminuir">−</button>
        <input aria-label="Quantidade" inputMode="numeric" value={qty} onChange={(e) => setQty(Math.max(1, Math.min(max, Number(e.target.value.replace(/\D/g, '')) || 1)))} />
        <button type="button" onClick={() => setQty((q) => Math.min(max, q + 1))} aria-label="Aumentar">+</button>
      </div>
      <AddToCartButton product={product} quantity={qty} />
    </div>
  );
}
