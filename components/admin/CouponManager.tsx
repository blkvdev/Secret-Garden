'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, toNumber } from './api';

export type CouponRow = { id: string; code: string; type: string; value: number; minValue: number; expiresAt: string; usageLimit: number | null; used: number; active: boolean };
const EMPTY = { code: '', type: 'PERCENT', value: '', minValue: '', expiresAt: '', usageLimit: '', active: true };
const money = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function CouponManager({ coupons }: { coupons: CouponRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [f, setF] = useState(EMPTY);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const open = (c?: CouponRow) => {
    setMsg('');
    if (c) { setEditing(c.id); setF({ code: c.code, type: c.type, value: String(c.value).replace('.', ','), minValue: c.minValue ? String(c.minValue).replace('.', ',') : '', expiresAt: c.expiresAt.slice(0, 10), usageLimit: c.usageLimit ? String(c.usageLimit) : '', active: c.active }); }
    else { setEditing('new'); setF(EMPTY); }
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg('');
    try {
      const body = { ...f, value: toNumber(f.value), minValue: f.minValue ? toNumber(f.minValue) : 0, usageLimit: f.usageLimit ? Number(f.usageLimit) : null };
      if (editing === 'new') await api('/api/admin/coupons', 'POST', body);
      else await api(`/api/admin/coupons/${editing}`, 'PUT', body);
      setEditing(null);
      router.refresh();
    } catch (err) { setMsg(err instanceof Error ? err.message : 'Erro'); }
    finally { setBusy(false); }
  }
  async function del(c: CouponRow) {
    if (!confirm(`Excluir o cupom ${c.code}?`)) return;
    await api(`/api/admin/coupons/${c.id}`, 'DELETE').catch((e) => alert(e.message));
    router.refresh();
  }

  return (
    <>
      <div className="page-head"><h1>Cupons</h1><button type="button" className="btn" onClick={() => open()}>+ Novo cupom</button></div>
      <p className="muted">O cliente digita o cupom no carrinho. O campo de cupom só aparece no site quando existe pelo menos um cupom ativo.</p>
      <div className="table-wrap" style={{ marginBottom: 22 }}>
        <table className="table">
          <thead><tr><th>Código</th><th>Desconto</th><th>Compra mínima</th><th>Validade</th><th>Usos</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id}>
                <td><code style={{ fontSize: '.95rem' }}>{c.code}</code></td>
                <td>{c.type === 'PERCENT' ? `${c.value}%` : money(c.value)}</td>
                <td>{c.minValue ? money(c.minValue) : '—'}</td>
                <td>{c.expiresAt ? c.expiresAt.slice(0, 10).split('-').reverse().join('/') : 'Sem validade'}</td>
                <td>{c.used}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                <td><span className={`status ${c.active ? 'status-on' : 'status-off'}`}>{c.active ? 'Ativo' : 'Inativo'}</span></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button type="button" className="btn btn-sm btn-outline" onClick={() => open(c)}>Editar</button>{' '}
                  <button type="button" className="link-btn" onClick={() => del(c)}>Excluir</button>
                </td>
              </tr>
            ))}
            {!coupons.length && <tr><td colSpan={7} className="muted">Nenhum cupom criado.</td></tr>}
          </tbody>
        </table>
      </div>
      {editing && (
        <form className="panel" onSubmit={save}>
          <h2 style={{ marginTop: 0 }}>{editing === 'new' ? 'Novo cupom' : 'Editar cupom'}</h2>
          <div className="form-grid">
            <div className="field"><label>Código</label><input required maxLength={30} placeholder="BEMVINDA10" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase().replace(/\s/g, '') })} /></div>
            <div className="field">
              <label>Tipo</label>
              <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option value="PERCENT">Porcentagem (%)</option><option value="FIXED">Valor em reais (R$)</option></select>
            </div>
            <div className="field"><label>Desconto</label><input required inputMode="decimal" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} /></div>
            <div className="field"><label>Compra mínima (R$)</label><input inputMode="decimal" placeholder="opcional" value={f.minValue} onChange={(e) => setF({ ...f, minValue: e.target.value })} /></div>
            <div className="field"><label>Válido até</label><input type="date" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} /></div>
            <div className="field"><label>Limite de usos</label><input type="number" min={1} placeholder="sem limite" value={f.usageLimit} onChange={(e) => setF({ ...f, usageLimit: e.target.value })} /></div>
          </div>
          <div className="checks"><label><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Ativo</label></div>
          {msg && <p className="alert alert-error">{msg}</p>}
          <div className="quick-actions">
            <button className="btn" disabled={busy}>{busy ? 'Salvando…' : 'Salvar cupom'}</button>
            <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancelar</button>
          </div>
        </form>
      )}
    </>
  );
}
