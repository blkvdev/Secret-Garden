'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, toNumber } from './api';

type City = { id: string; name: string; fee: number; active: boolean };
const input = { padding: 8, borderRadius: 4, border: '1px solid #c7d4c3' };

function Row({ c, onError }: { c: City; onError: (m: string) => void }) {
  const router = useRouter();
  const [name, setName] = useState(c.name);
  const [fee, setFee] = useState(String(c.fee).replace('.', ','));
  const [active, setActive] = useState(c.active);
  const dirty = name !== c.name || toNumber(fee) !== c.fee || active !== c.active;
  async function save() {
    try { await api(`/api/admin/cities/${c.id}`, 'PUT', { name, fee: toNumber(fee), active }); router.refresh(); }
    catch (e) { onError(e instanceof Error ? e.message : 'Erro'); }
  }
  async function del() {
    if (!confirm(`Remover ${c.name}?`)) return;
    await api(`/api/admin/cities/${c.id}`, 'DELETE').catch((e) => onError(e.message));
    router.refresh();
  }
  return (
    <tr>
      <td><input value={name} onChange={(e) => setName(e.target.value)} style={{ ...input, width: '100%' }} /></td>
      <td>R$ <input inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} style={{ ...input, width: 90 }} /></td>
      <td><label><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Ativa</label></td>
      <td style={{ whiteSpace: 'nowrap' }}><button type="button" className="btn btn-sm" disabled={!dirty} onClick={save}>Salvar</button>{' '}<button type="button" className="link-btn" onClick={del}>Excluir</button></td>
    </tr>
  );
}

export default function CityManager({ cities }: { cities: City[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [fee, setFee] = useState('');
  const [err, setErr] = useState('');
  async function add(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    const value = toNumber(fee || '0');
    if (!Number.isFinite(value) || value < 0) return setErr('Valor de frete inválido');
    try { await api('/api/admin/cities', 'POST', { name, fee: value, active: true }); setName(''); setFee(''); router.refresh(); }
    catch (e2) { setErr(e2 instanceof Error ? e2.message : 'Erro'); }
  }
  return (
    <>
      <form onSubmit={add} className="filters panel">
        <div className="field" style={{ flex: 1 }}><label>Cidade</label><input required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="field"><label>Frete (R$)</label><input inputMode="decimal" placeholder="0 = grátis" value={fee} onChange={(e) => setFee(e.target.value)} /></div>
        <button className="btn btn-sm">Adicionar</button>
      </form>
      {err && <p className="alert alert-error">{err}</p>}
      <div className="table-wrap" style={{ marginTop: 16 }}>
        <table className="table">
          <thead><tr><th>Cidade</th><th>Frete</th><th>Situação</th><th></th></tr></thead>
          <tbody>
            {cities.map((c) => <Row key={c.id} c={c} onError={setErr} />)}
            {!cities.length && <tr><td colSpan={4} className="muted">Nenhuma cidade. Sem cidade ativa o cliente não consegue finalizar.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
