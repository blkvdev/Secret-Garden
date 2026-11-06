'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useCart, type CartItem } from '@/components/CartProvider';
import SectionTitle from '@/components/SectionTitle';
import { brl } from '@/lib/format';

type City = { id: string; name: string; fee: number };
const EMPTY = { name: '', phone: '', city: '', neighborhood: '', street: '', number: '', complement: '', payment: '', notes: '' };
const FORM_KEY = 'secret-garden-checkout-form';

export default function CartPage() {
  const { items, ready, setQty, remove, clear, replace, subtotal } = useCart();
  const [cities, setCities] = useState<City[]>([]);
  const [payments, setPayments] = useState<string[]>([]);
  const [hasCoupons, setHasCoupons] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [step, setStep] = useState<'cart' | 'form'>('cart');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [synced, setSynced] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<{ code: string; discount: number; label: string } | null>(null);
  const [couponMsg, setCouponMsg] = useState('');

  useEffect(() => {
    fetch('/api/checkout').then((r) => r.json()).then((d) => {
      setCities(d.cities || []);
      setPayments(d.payments || []);
      setHasCoupons(!!d.hasCoupons);
    }).catch(() => setError('Não foi possível carregar as cidades de entrega.'));
    try {
      const saved = JSON.parse(localStorage.getItem(FORM_KEY) || 'null');
      if (saved) setForm({ ...EMPTY, ...saved, notes: '' });
    } catch { /* ignora */ }
  }, []);

  // atualiza preço/estoque do carrinho com o banco (promoções novas, preço alterado etc.)
  useEffect(() => {
    if (!ready || synced) return;
    setSynced(true);
    if (!items.length) return;
    fetch(`/api/products?ids=${items.map((i) => i.id).join(',')}`).then((r) => r.json())
      .then((d: { products: (Omit<CartItem, 'quantity'> & { available: boolean })[] }) => {
        const changed: string[] = [];
        const next: CartItem[] = [];
        for (const item of items) {
          const fresh = d.products.find((p) => p.id === item.id);
          if (!fresh || !fresh.available) { changed.push(`"${item.name}" não está mais disponível e foi removido.`); continue; }
          if (fresh.price !== item.price) changed.push(`O preço de "${fresh.name}" foi atualizado.`);
          const quantity = Math.min(item.quantity, fresh.stock);
          if (quantity < item.quantity) changed.push(`"${fresh.name}": só temos ${fresh.stock} unidade(s).`);
          next.push({ id: fresh.id, name: fresh.name, slug: fresh.slug, price: fresh.price, image: fresh.image, stock: fresh.stock, quantity });
        }
        if (changed.length) { replace(next); setNotice(changed.join(' ')); }
      }).catch(() => undefined);
  }, [ready, synced, items, replace]);

  async function applyCoupon(code: string, silent = false) {
    if (!code.trim()) return;
    setCouponMsg('');
    const res = await fetch('/api/coupon', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, subtotal }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setCoupon(null); if (!silent || coupon) setCouponMsg(d.error || 'Cupom inválido'); return; }
    setCoupon(d);
  }

  // se mudar o carrinho, recalcula o cupom
  useEffect(() => {
    if (coupon) applyCoupon(coupon.code, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  const shipping = useMemo(() => cities.find((c) => c.name === form.city)?.fee ?? 0, [cities, form.city]);
  const discount = coupon?.discount ?? 0;
  const total = Math.round((subtotal - discount + shipping) * 100) / 100;
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function finish(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.city) return setError('Escolha a cidade de entrega.');
    if (!form.payment) return setError('Escolha a forma de pagamento.');
    setSending(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.map((i) => ({ id: i.id, quantity: i.quantity })), customer: form, coupon: coupon?.code || '' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível registrar o pedido');
      const { notes: _n, ...keep } = form;
      localStorage.setItem(FORM_KEY, JSON.stringify(keep));
      clear();
      window.location.href = data.whatsappUrl; // abre o WhatsApp (funciona no celular sem bloqueio de pop-up)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
      setSending(false);
    }
  }

  if (!ready) return <div className="container empty">Carregando carrinho…</div>;

  if (!items.length) {
    return (
      <div className="container empty">
        <SectionTitle as="h1" caps="Seu carrinho" script="está vazio" />
        {notice && <p className="alert alert-info">{notice}</p>}
        <Link href="/" className="btn">Escolher flores</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-title"><SectionTitle as="h1" caps="Seu" script="carrinho" /></div>
      {notice && <p className="alert alert-info">{notice}</p>}
      <div className="cart-layout">
        <div className="panel">
          {items.map((i) => (
            <div className="cart-item" key={i.id}>
              <Link href={`/produto/${i.slug}`}><img src={i.image || '/placeholder.svg'} alt={i.name} /></Link>
              <div>
                <h3>{i.name}</h3>
                <p className="muted small" style={{ margin: '0 0 8px' }}>Preço unitário: {brl(i.price)}</p>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div className="qty">
                    <button type="button" onClick={() => setQty(i.id, i.quantity - 1)} aria-label="Diminuir">−</button>
                    <input aria-label="Quantidade" inputMode="numeric" value={i.quantity} onChange={(e) => setQty(i.id, Number(e.target.value.replace(/\D/g, '')) || 1)} />
                    <button type="button" onClick={() => setQty(i.id, i.quantity + 1)} disabled={i.quantity >= i.stock} aria-label="Aumentar">+</button>
                  </div>
                  <button type="button" className="link-btn" onClick={() => remove(i.id)}>Remover</button>
                </div>
              </div>
              <div className="cart-sub"><span className="muted small">Subtotal</span><br />{brl(i.price * i.quantity)}</div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, gap: 10, flexWrap: 'wrap' }}>
            <Link href="/" className="btn btn-outline btn-sm">← Continuar comprando</Link>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => confirm('Esvaziar o carrinho?') && clear()}>Esvaziar carrinho</button>
          </div>
        </div>

        <div className="panel">
          {hasCoupons && (
            <>
              <div className="coupon-row">
                <input placeholder="Cupom de desconto" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} maxLength={30} aria-label="Cupom" />
                <button type="button" className="btn btn-sm" onClick={() => applyCoupon(couponInput)}>Aplicar</button>
              </div>
              {coupon && <p className="alert alert-ok small">Cupom <b>{coupon.code}</b>: {coupon.label} <button type="button" className="link-btn" onClick={() => { setCoupon(null); setCouponInput(''); }}>remover</button></p>}
              {couponMsg && <p className="alert alert-error small">{couponMsg}</p>}
            </>
          )}

          {step === 'cart' ? (
            <>
              <div className="totals">
                <div className="row"><span>Subtotal</span><span>{brl(subtotal)}</span></div>
                {discount > 0 && <div className="row discount"><span>Desconto</span><span>- {brl(discount)}</span></div>}
                <div className="row muted"><span>Frete</span><span>no próximo passo</span></div>
                <div className="row total"><span>Total</span><span>{brl(subtotal - discount)}</span></div>
              </div>
              <button type="button" className="btn btn-block" style={{ marginTop: 18 }} onClick={() => setStep('form')}>Finalizar pedido</button>
            </>
          ) : (
            <form onSubmit={finish}>
              <h2 className="caps" style={{ fontSize: '.9rem', marginTop: 18 }}> Entrega</h2>
              <div className="form-grid">
                <div className="field span-2"><label htmlFor="name">Nome *</label><input id="name" required maxLength={80} value={form.name} onChange={set('name')} autoComplete="name" /></div>
                <div className="field span-2"><label htmlFor="phone">Telefone (opcional)</label><input id="phone" maxLength={25} inputMode="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" /></div>
                <div className="field">
                  <label htmlFor="city">Cidade *</label>
                  <select id="city" required value={form.city} onChange={set('city')}>
                    <option value="">Selecione…</option>
                    {cities.map((c) => <option key={c.id} value={c.name}>{c.name} — {c.fee > 0 ? brl(c.fee) : 'grátis'}</option>)}
                  </select>
                </div>
                <div className="field"><label htmlFor="neighborhood">Bairro *</label><input id="neighborhood" required maxLength={80} value={form.neighborhood} onChange={set('neighborhood')} /></div>
                <div className="field"><label htmlFor="street">Endereço *</label><input id="street" required maxLength={150} placeholder="Rua / Avenida" value={form.street} onChange={set('street')} autoComplete="address-line1" /></div>
                <div className="field"><label htmlFor="number">Número *</label><input id="number" required maxLength={15} value={form.number} onChange={set('number')} /></div>
                <div className="field span-2"><label htmlFor="complement">Complemento</label><input id="complement" maxLength={120} placeholder="Casa azul, apto 12…" value={form.complement} onChange={set('complement')} /></div>
              </div>
              <div className="field">
                <span> Forma de pagamento *</span>
                <div className="pay-options">
                  {payments.map((p) => (
                    <label key={p} className={form.payment === p ? 'on' : ''}>
                      <input type="radio" name="payment" value={p} checked={form.payment === p} onChange={set('payment')} />{p}
                    </label>
                  ))}
                </div>
                <span className="muted small" style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 300 }}>O pagamento é combinado direto com a floricultura pelo WhatsApp.</span>
              </div>
              <div className="field"><label htmlFor="notes">Observações</label><textarea id="notes" rows={3} maxLength={500} placeholder="Mensagem do cartão, horário de entrega…" value={form.notes} onChange={set('notes')} /></div>
              <div className="totals">
                <div className="row"><span>Subtotal</span><span>{brl(subtotal)}</span></div>
                {discount > 0 && <div className="row discount"><span>Desconto ({coupon?.code})</span><span>- {brl(discount)}</span></div>}
                <div className="row"><span>Frete {form.city && `(${form.city})`}</span><span>{form.city ? brl(shipping) : '—'}</span></div>
                <div className="row total"><span>Total</span><span>{brl(total)}</span></div>
              </div>
              {error && <p className="alert alert-error">{error}</p>}
              <button className="btn btn-whatsapp" style={{ marginTop: 14 }} disabled={sending}>{sending ? 'Registrando pedido…' : 'Finalizar pelo WhatsApp'}</button>
              <button type="button" className="btn btn-outline btn-block" style={{ marginTop: 10 }} onClick={() => setStep('cart')}>Voltar</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
