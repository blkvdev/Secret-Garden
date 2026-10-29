'use client';

import { useState } from 'react';
import { useCart, type CartProduct } from './CartProvider';

export default function AddToCartButton({ product, quantity = 1, block, outline }: { product: CartProduct; quantity?: number; block?: boolean; outline?: boolean }) {
  const { add, items } = useCart();
  const [done, setDone] = useState(false);
  const inCart = items.find((i) => i.id === product.id)?.quantity ?? 0;
  const cls = `btn ${outline ? 'btn-outline' : ''} ${block ? 'btn-block' : ''}`;

  if (product.stock <= 0) return <button className={cls} disabled type="button">Esgotado</button>;
  const full = inCart >= product.stock;
  return (
    <button
      type="button"
      className={cls}
      disabled={full}
      onClick={() => { add(product, quantity); setDone(true); setTimeout(() => setDone(false), 1400); }}
    >
      {full ? 'Limite do estoque' : done ? '✓ Adicionado' : 'Adicionar ao carrinho'}
    </button>
  );
}
