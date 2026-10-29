import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import QuickOrderActions from '@/components/admin/QuickOrderActions';
import { db } from '@/lib/db';
import { brl, formatDate, fromLocalInput } from '@/lib/format';
import { ORDER_STATUSES, PENDING_STATUSES, SOLD_STATUSES, orderCode, statusLabel } from '@/lib/orders';

export const dynamic = 'force-dynamic';

type SP = Promise<{ q?: string; status?: string; city?: string; from?: string; to?: string; tab?: string }>;

export default async function OrdersPage({ searchParams }: { searchParams: SP }) {
  const { q = '', status = '', city = '', from = '', to = '', tab = 'pendentes' } = await searchParams;

  const where: Prisma.OrderWhereInput = {};
  if (status) where.status = status;
  else if (tab === 'pendentes') where.status = { in: PENDING_STATUSES };
  else if (tab === 'vendidos') where.status = { in: SOLD_STATUSES };
  else if (tab === 'cancelados') where.status = 'CANCELADO';
  if (city) where.city = city;
  const f = fromLocalInput(from), t = fromLocalInput(to, true);
  if (f || t) where.createdAt = { ...(f ? { gte: f } : {}), ...(t ? { lte: t } : {}) };
  if (q) {
    const n = Number(q.replace(/\D/g, ''));
    where.OR = [{ customerName: { contains: q } }, { phone: { contains: q } }, { neighborhood: { contains: q } }, ...(n ? [{ id: n }] : [])];
  }

  const [orders, cities, counts] = await Promise.all([
    db.order.findMany({ where, include: { items: true }, orderBy: { createdAt: 'desc' }, take: 300 }),
    db.order.findMany({ distinct: ['city'], select: { city: true }, orderBy: { city: 'asc' } }),
    db.order.groupBy({ by: ['status'], _count: true }),
  ]);
  const count = (list: string[]) => counts.filter((c) => list.includes(c.status)).reduce((s, c) => s + c._count, 0);
  const tabs = [
    { key: 'pendentes', label: `Aguardando (${count(PENDING_STATUSES)})` },
    { key: 'vendidos', label: `Vendidos (${count(SOLD_STATUSES)})` },
    { key: 'cancelados', label: `Cancelados (${count(['CANCELADO'])})` },
    { key: 'todos', label: 'Todos' },
  ];
  const total = orders.reduce((s, o) => s + o.total, 0);

  return (
    <>
      <h1>Pedidos</h1>
      <div className="tabs" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        {tabs.map((t) => <Link key={t.key} href={`/admin/pedidos?tab=${t.key}`} className={!status && tab === t.key ? 'on' : ''}>{t.label}</Link>)}
      </div>
      <form className="filters">
        <input type="hidden" name="tab" value={tab} />
        <div className="field"><label>Buscar</label><input name="q" defaultValue={q} placeholder="Nome, telefone, nº…" /></div>
        <div className="field">
          <label>Status</label>
          <select name="status" defaultValue={status}>
            <option value="">—</option>
            {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Cidade</label>
          <select name="city" defaultValue={city}>
            <option value="">Todas</option>
            {cities.map((c) => <option key={c.city} value={c.city}>{c.city}</option>)}
          </select>
        </div>
        <div className="field"><label>De</label><input type="date" name="from" defaultValue={from} /></div>
        <div className="field"><label>Até</label><input type="date" name="to" defaultValue={to} /></div>
        <button className="btn btn-outline btn-sm">Filtrar</button>
        <Link href="/admin/pedidos" className="btn btn-outline btn-sm">Limpar</Link>
      </form>
      <p className="muted small">{orders.length} pedido(s) · soma {brl(total)}</p>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Pedido</th><th>Cliente</th><th>Entrega</th><th>Itens</th><th>Pagamento</th><th>Total</th><th>Status</th><th>Ação</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/admin/pedidos/${o.id}`}><b>{orderCode(o.id)}</b></Link><br /><span className="muted small">{formatDate(o.createdAt)}</span></td>
                <td>{o.customerName}{o.phone && <><br /><span className="muted small">{o.phone}</span></>}</td>
                <td>{o.city}<br /><span className="muted small">{o.neighborhood}</span></td>
                <td className="small">{o.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}</td>
                <td>{o.payment}</td>
                <td><b>{brl(o.total)}</b>{o.couponCode && <><br /><span className="muted small">cupom {o.couponCode}</span></>}</td>
                <td><Link href={`/admin/pedidos/${o.id}`}><span className={`status status-${o.status}`}>{statusLabel(o.status)}</span></Link></td>
                <td><QuickOrderActions id={o.id} status={o.status} /></td>
              </tr>
            ))}
            {!orders.length && <tr><td colSpan={8} className="muted">Nenhum pedido encontrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
