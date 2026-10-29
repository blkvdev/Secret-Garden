'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from './api';

type Cat = { id: string; name: string; slug: string; position: number; active: boolean; count: number };
const input = { padding: 8, borderRadius: 4, border: '1px solid #c7d4c3' };

function Row({ c, onError }: { c: Cat; onError: (m: string) => void }) {
  const router = useRouter();
  const [name, setName] = useState(c.name);
  const [position, setPosition] = useState(String(c.position));
  const [active, setActive] = useState(c.active);
  const dirty = name !== c.name || Number(position) !== c.position || active !== c.active;
  async function save() {
    try { await api(`/api/admin/categories/${c.id}`, 'PUT', { name, position: Number(position), active }); router.refresh(); }
    catch (e) { onError(e instanceof Error ? e.message : 'Erro'); }
  }
  async function del() {
    if (!confirm(`Excluir a categoria "${c.name}"?`)) return;
    try { await api(`/api/admin/categories/${c.id}`, 'DELETE'); router.refresh(); }
    catch (e) { onError(e instanceof Error ? e.message : 'Erro'); }
  }
  return (
    <tr>
      <td><input value={name} onChange={(e) => setName(e.target.value)} style={{ ...input, width: '100%' }} /></td>
      <td className="small muted">/categoria/{c.slug}</td>
      <td><input type="number" value={position} onChange={(e) => setPosition(e.target.value)} style={{ ...input, width: 70 }} /></td>
      <td><label><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Ativa</label></td>
      <td>{c.count}</td>
      <td style={{ whiteSpace: 'nowrap' }}><button type="button" className="btn btn-sm" disabled={!dirty} onClick={save}>Salvar</button>{' '}<button type="button" className="link-btn" onClick={del}>Excluir</button></td>
    </tr>
  );
}

export default function CategoryManager({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  async function add(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    try { await api('/api/admin/categories', 'POST', { name, position: categories.length + 1, active: true }); setName(''); router.refresh(); }
    catch (e2) { setErr(e2 instanceof Error ? e2.message : 'Erro'); }
  }
  return (
    <>
      <form onSubmit={add} className="filters panel">
        <div className="field" style={{ flex: 1 }}><label>Nova categoria</label><input required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Cestas, Arranjos…" /></div>
        <button className="btn btn-sm">Adicionar</button>
      </form>
      {err && <p className="alert alert-error">{err}</p>}
      <div className="table-wrap" style={{ marginTop: 16 }}>
        <table className="table">
          <thead><tr><th>Nome</th><th>Link</th><th>Ordem no menu</th><th>Situação</th><th>Produtos</th><th></th></tr></thead>
          <tbody>{categories.map((c) => <Row key={c.id} c={c} onError={setErr} />)}</tbody>
        </table>
      </div>
    </>
  );
}
