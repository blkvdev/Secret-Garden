'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ORDER_STATUSES, PENDING_STATUSES, SOLD_STATUSES } from '@/lib/orders';
import { api } from './api';

export default function OrderStatusForm({ id, status, internalNotes, stockDeducted }: { id: number; status: string; internalNotes: string; stockDeducted: boolean }) {
  const router = useRouter();
  const [s, setS] = useState(status);
  const [notes, setNotes] = useState(internalNotes);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const willDeduct = SOLD_STATUSES.includes(s) && !stockDeducted;
  const willReturn = !SOLD_STATUSES.includes(s) && stockDeducted;

  async function send(next: string) {
    setBusy(true); setMsg(null);
    try {
      await api(`/api/admin/orders/${id}`, 'PATCH', { status: next, internalNotes: notes });
      setS(next);
      setMsg({ ok: true, text: 'Pedido atualizado!' });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Erro' });
    } finally { setBusy(false); }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (willDeduct && !confirm('Concluir a venda? O estoque dos produtos será baixado.')) return;
    if (willReturn && !confirm('O estoque deste pedido será devolvido. Continuar?')) return;
    send(s);
  }

  return (
    <form onSubmit={save} className="panel">
      {PENDING_STATUSES.includes(status) && (
        <>
          <button type="button" className="btn btn-success btn-block" disabled={busy}
            onClick={() => confirm('Concluir esta venda? Ela entra no faturamento e o estoque é baixado.') && send('CONFIRMADO')}>
            ✅ Concluir venda
          </button>
          <p className="muted small" style={{ textAlign: 'center' }}>Use quando o cliente confirmar pelo WhatsApp.</p>
        </>
      )}
      <h2 style={{ marginTop: 6 }}>Status do pedido</h2>
      <div className="field">
        <label>Status</label>
        <select value={s} onChange={(e) => setS(e.target.value)}>
          {ORDER_STATUSES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      {willDeduct && <p className="alert alert-info small">Ao salvar, a venda será concluída e o estoque <b>baixado</b>.</p>}
      {willReturn && <p className="alert alert-info small">Ao salvar, o estoque deste pedido será <b>devolvido</b> e ele sai do faturamento.</p>}
      <div className="field">
        <label>Observação interna (o cliente não vê)</label>
        <textarea rows={4} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      {msg && <p className={`alert ${msg.ok ? 'alert-ok' : 'alert-error'}`}>{msg.text}</p>}
      <button className="btn btn-block btn-outline" disabled={busy}>{busy ? 'Salvando…' : 'Salvar'}</button>
    </form>
  );
}
