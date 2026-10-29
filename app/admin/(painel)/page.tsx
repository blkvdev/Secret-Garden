import Link from 'next/link';
import BarChart from '@/components/admin/BarChart';
import QuickOrderActions from '@/components/admin/QuickOrderActions';
import { db } from '@/lib/db';
import { brl, dayKey, formatDate, round2 } from '@/lib/format';
import { PENDING_STATUSES, SOLD_STATUSES, orderCode, statusLabel } from '@/lib/orders';
import { getActivePromotions } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

const PERIODS = { '7': '7 dias', '30': '30 dias', '90': '90 dias', '12m': '12 meses' } as const;
type Period = keyof typeof PERIODS;
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ p?: string; m?: string }> }) {
  const sp = await searchParams;
  const period: Period = sp.p && sp.p in PERIODS ? (sp.p as Period) : '30';
  const metric = sp.m === 'qtd' ? 'qtd' : 'valor';

  const now = new Date();
  const since = new Date(now);
  if (period === '12m') { since.setMonth(since.getMonth() - 11); since.setDate(1); } else since.setDate(since.getDate() - (Number(period) - 1));
  since.setHours(0, 0, 0, 0);

  const [products, sold, pending, recentPending, topItems, promos, todayStart] = await Promise.all([
    db.product.findMany({ select: { id: true, name: true, active: true, stock: true, minStock: true, promoPrice: true, price: true } }),
    db.order.findMany({ where: { status: { in: SOLD_STATUSES }, soldAt: { not: null } }, select: { total: true, soldAt: true } }),
    db.order.count({ where: { status: { in: PENDING_STATUSES } } }),
    db.order.findMany({ where: { status: { in: PENDING_STATUSES } }, orderBy: { createdAt: 'desc' }, take: 8 }),
    db.orderItem.groupBy({ by: ['productName'], where: { order: { status: { in: SOLD_STATUSES } } }, _sum: { quantity: true, subtotal: true }, orderBy: { _sum: { quantity: 'desc' } }, take: 6 }),
    getActivePromotions(),
    Promise.resolve(dayKey(now)),
  ]);

  // ----- monta o gráfico -----
  const inRange = sold.filter((o) => o.soldAt! >= since);
  const buckets = new Map<string, { label: string; title: string; valor: number; qtd: number }>();
  if (period === '12m') {
    for (let k = 0; k < 12; k++) {
      const d = new Date(since.getFullYear(), since.getMonth() + k, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      buckets.set(key, { label: `${MONTHS[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`, title: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, valor: 0, qtd: 0 });
    }
    for (const o of inRange) {
      const local = new Date(o.soldAt!.getTime() - 3 * 3600_000);
      const b = buckets.get(`${local.getUTCFullYear()}-${local.getUTCMonth()}`);
      if (b) { b.valor += o.total; b.qtd += 1; }
    }
  } else {
    for (let k = 0; k < Number(period); k++) {
      const d = new Date(since.getTime() + k * 86400_000 + 12 * 3600_000);
      const key = dayKey(d);
      buckets.set(key, { label: `${key.slice(8, 10)}/${key.slice(5, 7)}`, title: `${key.slice(8, 10)}/${key.slice(5, 7)}/${key.slice(0, 4)}`, valor: 0, qtd: 0 });
    }
    for (const o of inRange) { const b = buckets.get(dayKey(o.soldAt!)); if (b) { b.valor += o.total; b.qtd += 1; } }
  }
  const chart = [...buckets.values()].map((b) => ({
    label: b.label, value: metric === 'valor' ? round2(b.valor) : b.qtd,
    title: `${b.title}: ${brl(b.valor)} em ${b.qtd} venda(s)`,
  }));

  const revenue = inRange.reduce((s, o) => s + o.total, 0);
  const today = sold.filter((o) => dayKey(o.soldAt!) === todayStart);
  const ticket = inRange.length ? revenue / inRange.length : 0;
  const out = products.filter((p) => p.stock <= 0);
  const low = products.filter((p) => p.stock > 0 && p.stock <= p.minStock);
  const maxTop = Math.max(1, ...topItems.map((t) => t._sum.quantity || 0));
  const q = (p: string, m: string) => `/admin?p=${p}&m=${m}`;

  return (
    <>
      <div className="page-head"><h1>Dashboard</h1><Link href="/admin/pedidos" className="btn btn-sm">Ver pedidos</Link></div>

      <div className="stats">
        <div className="stat dark"><span>Vendas hoje</span><strong>{brl(today.reduce((s, o) => s + o.total, 0))}</strong><small>{today.length} venda(s)</small></div>
        <div className="stat"><span>Faturamento ({PERIODS[period]})</span><strong>{brl(revenue)}</strong><small>{inRange.length} venda(s)</small></div>
        <div className="stat"><span>Ticket médio</span><strong>{brl(ticket)}</strong></div>
        <div className="stat warn"><span>Aguardando você</span><strong>{pending}</strong><small>pedidos enviados p/ WhatsApp</small></div>
      </div>

      <div className="chart-card">
        <div className="chart-head">
          <h2>📈 Vendas concluídas</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div className="tabs">
              <Link className={metric === 'valor' ? 'on' : ''} href={q(period, 'valor')}>R$</Link>
              <Link className={metric === 'qtd' ? 'on' : ''} href={q(period, 'qtd')}>Qtd</Link>
            </div>
            <div className="tabs">
              {(Object.keys(PERIODS) as Period[]).map((p) => <Link key={p} className={p === period ? 'on' : ''} href={q(p, metric)}>{PERIODS[p]}</Link>)}
            </div>
          </div>
        </div>
        {inRange.length === 0 && <p className="muted small" style={{ margin: '0 0 6px' }}>Nenhuma venda concluída nesse período. Use o botão <b>✅ Concluir venda</b> nos pedidos.</p>}
        <BarChart data={chart} format={metric === 'valor' ? 'money' : 'int'} />
      </div>

      <div className="two-col">
        <div>
          <h2>⏳ Pedidos aguardando confirmação</h2>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Status</th><th>Ação</th></tr></thead>
              <tbody>
                {recentPending.map((o) => (
                  <tr key={o.id}>
                    <td><Link href={`/admin/pedidos/${o.id}`}><b>{orderCode(o.id)}</b></Link><br /><span className="muted small">{formatDate(o.createdAt)}</span></td>
                    <td>{o.customerName}<br /><span className="muted small">{o.city}</span></td>
                    <td><b>{brl(o.total)}</b></td>
                    <td><span className={`status status-${o.status}`}>{statusLabel(o.status)}</span></td>
                    <td><QuickOrderActions id={o.id} status={o.status} /></td>
                  </tr>
                ))}
                {!recentPending.length && <tr><td colSpan={5} className="muted">Tudo em dia! 🌿</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="alert alert-info small" style={{ marginTop: 14 }}>
            <b>Enviado para WhatsApp</b> = o cliente abriu a conversa, ainda não é venda. Quando ele confirmar, clique em <b>✅ Concluir venda</b>: o pedido entra no faturamento e no gráfico, e o estoque é baixado.
          </p>
        </div>
        <div>
          <h2>🏆 Mais vendidos</h2>
          <div className="panel">
            {topItems.map((t) => (
              <div className="hbar" key={t.productName}>
                <span>{t.productName}</span>
                <div className="track"><div className="fill" style={{ width: `${((t._sum.quantity || 0) / maxTop) * 100}%` }} /></div>
                <b>{t._sum.quantity}</b>
              </div>
            ))}
            {!topItems.length && <p className="muted small" style={{ margin: 0 }}>Sem vendas concluídas ainda.</p>}
          </div>
          <div className="stats" style={{ marginTop: 18 }}>
            <div className="stat"><span>Produtos ativos</span><strong>{products.filter((p) => p.active).length}<small> / {products.length}</small></strong></div>
            <div className="stat"><span>Promoções ativas</span><strong>{promos.length + products.filter((p) => p.promoPrice != null && p.promoPrice < p.price).length}</strong></div>
            <div className="stat bad"><span>Sem estoque</span><strong>{out.length}</strong></div>
            <div className="stat warn"><span>Estoque baixo</span><strong>{low.length}</strong></div>
          </div>
          {(out.length > 0 || low.length > 0) && (
            <div className="table-wrap">
              <table className="table">
                <tbody>
                  {[...out, ...low].slice(0, 8).map((p) => (
                    <tr key={p.id}>
                      <td><Link href={`/admin/produtos/${p.id}`}>{p.name}</Link></td>
                      <td><span className={`status ${p.stock <= 0 ? 'status-CANCELADO' : 'status-wait'}`}>{p.stock} un.</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
