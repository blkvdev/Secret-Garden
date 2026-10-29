'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type CartItem = { id: string; name: string; slug: string; price: number; image: string | null; stock: number; quantity: number };
export type CartProduct = Omit<CartItem, 'quantity'>;

type Ctx = {
  items: CartItem[]; ready: boolean; count: number; subtotal: number;
  add: (p: CartProduct, qty?: number) => void; setQty: (id: string, qty: number) => void;
  remove: (id: string) => void; clear: () => void; replace: (items: CartItem[]) => void;
};

const CartContext = createContext<Ctx | null>(null);
const KEY = 'secret-garden-cart-v3';

const isValid = (i: unknown): i is CartItem => {
  const x = i as CartItem;
  return !!x && typeof x.id === 'string' && typeof x.price === 'number' && typeof x.quantity === 'number' && x.quantity > 0;
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  // o carrinho fica salvo no navegador (continua lá se atualizar a página)
  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (Array.isArray(parsed)) setItems(parsed.filter(isValid));
    } catch { /* ignora */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  const add = useCallback((p: CartProduct, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => i.id === p.id);
      if (found) return prev.map((i) => (i.id === p.id ? { ...i, ...p, quantity: Math.min(i.quantity + qty, p.stock) } : i));
      return [...prev, { ...p, quantity: Math.max(1, Math.min(qty, p.stock)) }];
    });
  }, []);
  const setQty = useCallback((id: string, qty: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, Math.min(Math.floor(qty) || 1, i.stock || 1)) } : i)));
  }, []);
  const remove = useCallback((id: string) => setItems((prev) => prev.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);
  const replace = useCallback((next: CartItem[]) => setItems(next), []);

  const value = useMemo(() => ({
    items, ready, count: items.reduce((s, i) => s + i.quantity, 0),
    subtotal: Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100,
    add, setQty, remove, clear, replace,
  }), [items, ready, add, setQty, remove, clear, replace]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart precisa estar dentro de CartProvider');
  return ctx;
}
