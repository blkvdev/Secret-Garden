'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { api, toNumber } from './api';

export type PromoRow = {
  id: string; name: string; type: string; value: number; startsAt: string; endsAt: string; active: boolean;
  allProducts: boolean; productIds: string[]; state: 'live' | 'scheduled' | 'ended' | 'off';
};
type Prod = { id: string; name: string; price: number; category: string };

const today = () => new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);
const EMPTY = { name: '', type: 'PERCENT', value: '', startsAt: '', endsAt: '', active: true, allProducts: false, productIds: [] as string[] };
const STATE = { live: ['No ar', 'status-on'], scheduled: ['Agendada', 'status-wait'], ended: ['Encerrada', 'status-off'], off: ['Desativada', 'status-off'] } as const;
const money = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function PromotionManager({ promos, products }: { promos: PromoRow[]; products: Prod[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [f, setF] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const open = (p?: PromoRow) => {
    setMsg('');
    if (p) { setEditing(p.id); setF({ ...p, value: String(p.value).replace('.', ','), startsAt: p.startsAt.slice(0, 10), endsAt: p.endsAt.slice(0, 10) }); }
    else { setEditing('new'); setF({ ...EMPTY, startsAt: today(), endsAt: today() }); }
    setTimeout(() => document.getElementById('promo-form')?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const value = toNumber(f.value);
  const preview = (price: number) => {
    if (!Number.isFinite(value) || value <= 0) return price;
    return Math.max(0.01, f.type === 'PERCENT' ? price * (1 - value / 100) : price - value);
  };
  const filtered = useMemo(() => products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())), [products, search]);
  const toggleProduct = (id: string) => setF((x) => ({ ...x, productIds: x.productIds.includes(id) ? x.productIds.filter((i) => i !== id) : [...x.productIds, id] }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg('');
    try {
      const body = { ...f, value };
      if (editing === 'new') await api('/api/admin/promotions', 'POST', body);
      else await api(`/api/admin/promotions/${editing}`, 'PUT', body);
      setEditing(null);
      router.refresh();
    } catch (err) { setMsg(err instanceof Error ? err.message : 'Erro'); }
    finally { setBusy(false); }
  }
  async function del(p: PromoRow) {
    if (!confirm(`Excluir a promoção "${p.name}"?`)) return;
    await api(`/api/admin/promotions/${p.id}`, 'DELETE').catch((e) => alert(e.message));
    router.refresh();
  }

  return (
    <>
      <div className="page-head"><h1>Promoções</h1><button type="button" className="btn" onClick={() => open()}>+ Nova promoção</button></div>
      <p className="muted">Crie campanhas com data de início e fim (ex.: Dia das Mães). Elas entram e saem do ar sozinhas. O site mostra o preço antigo riscado e o carrinho já usa o preço com desconto.</p>

      <div className="table-wrap" style={{ marginBottom: 22 }}>
        <table className="table">
          <thead><tr><th>Promoção</th><th>Desconto</th><th>Período</th><th>Produtos</th><th>Situação</th><th></th></tr></thead>
          <tbody>
            {promos.map((p) => (
              <tr key={p.id}>
                <td><b>{p.name}</b></td>
                <td>{p.type === 'PERCENT' ? `${p.value}%` : money(p.value)}</td>
                <td className="small">{p.startsAt.slice(0, 10).split('-').reverse().join('/')} → {p.endsAt.slice(0, 10).split('-').reverse().join('/')}</td>
                <td>{p.allProducts ? 'Loja toda' : `${p.productIds.length} produto(s)`}</td>
                <td><span className={`status ${STATE[p.state][1]}`}>{STATE[p.state][0]}</span></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button type="button" className="btn btn-sm btn-outline" onClick={() => open(p)}>Editar</button>{' '}
                  <button type="button" className="link-btn" onClick={() => del(p)}>Excluir</button>
                </td>
              </tr>
            ))}
            {!promos.length && <tr><td colSpan={6} className="muted">Nenhuma promoção criada.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <form id="promo-form" className="panel" onSubmit={save}>
          <h2 style={{ marginTop: 0 }}>{editing === 'new' ? 'Nova promoção' : 'Editar promoção'}</h2>
          <div className="form-grid">
            <div className="field span-2"><label>Nome (aparece no produto)</label><input required maxLength={80} placeholder="Semana das Rosas" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div className="field">
              <label>Tipo de desconto</label>
              <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option value="PERCENT">Porcentagem (%)</option><option value="FIXED">Valor em reais (R$)</option></select>
            </div>
            <div className="field"><label>Desconto {f.type === 'PERCENT' ? '(%)' : '(R$)'}</label><input required inputMode="decimal" placeholder={f.type === 'PERCENT' ? '20' : '10,00'} value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} /></div>
            <div className="field"><label>Começa em</label><input type="date" required value={f.startsAt} onChange={(e) => setF({ ...f, startsAt: e.target.value })} /></div>
            <div className="field"><label>Termina em (fim do dia)</label><input type="date" required value={f.endsAt} onChange={(e) => setF({ ...f, endsAt: e.target.value })} /></div>
          </div>
          <div className="checks">
            <label><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Ativa</label>
            <label><input type="checkbox" checked={f.allProducts} onChange={(e) => setF({ ...f, allProducts: e.target.checked })} /> Vale para a loja toda</label>
          </div>
          {!f.allProducts && (
            <div className="field">
              <span>Produtos da promoção ({f.productIds.length} selecionados)</span>
              <input placeholder="Buscar produto…" value={search} onChange={(e) => setSearch(e.target.value)} />
              <div className="product-pick">
                {filtered.map((p) => (
                  <label key={p.id}>
                    <input type="checkbox" checked={f.productIds.includes(p.id)} onChange={() => toggleProduct(p.id)} />
                    <span style={{ flex: 1 }}>{p.name} <span className="muted small">· {p.category}</span></span>
                    <span className="small"><span className="price-old">{money(p.price)}</span> <b>{money(preview(p.price))}</b></span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {msg && <p className="alert alert-error">{msg}</p>}
          <div className="quick-actions">
            <button className="btn" disabled={busy}>{busy ? 'Salvando…' : 'Salvar promoção'}</button>
            <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancelar</button>
          </div>
        </form>
      )}
    </>
  );
}
