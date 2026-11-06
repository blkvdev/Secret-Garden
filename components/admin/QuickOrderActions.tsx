'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PENDING_STATUSES } from '@/lib/orders';
import { api } from './api';

// Botões rápidos: concluir a venda / marcar como entregue / cancelar
export default function QuickOrderActions({ id, status }: { id: number; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function change(next: string, question: string) {
    if (!confirm(question)) return;
    setBusy(true);
    try {
      await api(`/api/admin/orders/${id}`, 'PATCH', { status: next });
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro');
    } finally {
      setBusy(false);
    }
  }

  if (PENDING_STATUSES.includes(status)) {
    return (
      <div className="quick-actions">
        <button type="button" className="btn btn-sm btn-success" disabled={busy} onClick={() => change('CONFIRMADO', 'Concluir esta venda? O pedido entra no faturamento e o estoque é baixado.')}>
          Concluir venda
        </button>
        <button type="button" className="btn btn-sm btn-outline" disabled={busy} onClick={() => change('CANCELADO', 'Cancelar este pedido?')}>Cancelar</button>
      </div>
    );
  }
  if (status === 'CONFIRMADO' || status === 'EM_PREPARACAO' || status === 'SAIU_PARA_ENTREGA') {
    return (
      <button type="button" className="btn btn-sm btn-outline" disabled={busy} onClick={() => change('ENTREGUE', 'Marcar como entregue?')}> Entregue</button>
    );
  }
  return null;
}
