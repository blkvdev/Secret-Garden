'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from './api';

type Movement = { id: string; change: number; reason: string; createdAt: string };

export default function StockPanel({ productId, stock, minStock, movements }: { productId: string; stock: number; minStock: number; movements: Movement[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<'add' | 'remove' | 'set'>('add');
  const [qty, setQty] = useState('1');
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg('');
    try { await api(`/api/admin/products/${productId}/stock`, 'POST', { mode, quantity: Number(qty), reason }); setReason(''); router.refresh(); }
    catch (err) { setMsg(err instanceof Error ? err.message : 'Erro'); }
    finally { setBusy(false); }
  }

  return (
    <div className="panel">
      <h2 style={{ marginTop: 0 }}> Estoque</h2>
      <p style={{ fontSize: '2rem', margin: '0 0 4px', fontWeight: 600, color: stock <= 0 ? 'var(--danger)' : stock <= minStock ? '#b06a00' : 'var(--leaf-dark)' }}>{stock} un.</p>
      <p className="muted small" style={{ marginTop: 0 }}>Alerta quando chegar a {minStock}. O estoque baixa quando você conclui a venda.</p>
      <form onSubmit={submit}>
        <div className="form-grid">
          <div className="field">
            <label>Ação</label>
            <select value={mode} onChange={(e) => setMode(e.target.value as 'add' | 'remove' | 'set')}>
              <option value="add">Adicionar</option><option value="remove">Remover</option><option value="set">Ajustar para</option>
            </select>
          </div>
          <div className="field"><label>Quantidade</label><input type="number" min={0} required value={qty} onChange={(e) => setQty(e.target.value)} /></div>
          <div className="field span-2"><label>Motivo</label><input maxLength={120} placeholder="Chegada do fornecedor, perda…" value={reason} onChange={(e) => setReason(e.target.value)} /></div>
        </div>
        {msg && <p className="alert alert-error">{msg}</p>}
        <button className="btn btn-sm" disabled={busy}>Aplicar</button>
      </form>
      <h3 className="caps small" style={{ marginTop: 22 }}>Histórico</h3>
      <div className="table-wrap" style={{ maxHeight: 320, overflowY: 'auto' }}>
        <table className="table small">
          <tbody>
            {movements.map((m) => (
              <tr key={m.id}>
                <td style={{ color: m.change < 0 ? 'var(--danger)' : 'var(--leaf-dark)', fontWeight: 600 }}>{m.change > 0 ? `+${m.change}` : m.change}</td>
                <td>{m.reason}</td><td className="muted">{m.createdAt}</td>
              </tr>
            ))}
            {!movements.length && <tr><td className="muted">Sem movimentações.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
