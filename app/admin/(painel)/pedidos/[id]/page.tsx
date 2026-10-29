import Link from 'next/link';
import { notFound } from 'next/navigation';
import OrderStatusForm from '@/components/admin/OrderStatusForm';
import { db } from '@/lib/db';
import { brl, formatDate } from '@/lib/format';
import { orderCode, statusLabel } from '@/lib/orders';
import { whatsappLink } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const o = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!o) notFound();

  return (
    <>
      <div className="page-head"><h1>Pedido {orderCode(o.id)}</h1><Link href="/admin/pedidos" className="btn btn-outline btn-sm">← Voltar</Link></div>
      <p>
        <span className={`status status-${o.status}`}>{statusLabel(o.status)}</span>{' '}
        <span className="muted small">Criado em {formatDate(o.createdAt)}{o.soldAt && ` · vendido em ${formatDate(o.soldAt)}`}</span>
      </p>
      <div className="two-col">
        <div>
          <div className="panel" style={{ marginBottom: 20 }}>
            <h2 style={{ marginTop: 0 }}>Produtos</h2>
            <div className="table-wrap" style={{ border: 0 }}>
              <table className="table">
                <thead><tr><th>Produto</th><th>Qtd</th><th>Unitário</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {o.items.map((i) => (
                    <tr key={i.id}>
                      <td>{i.productId ? <Link href={`/admin/produtos/${i.productId}`}>{i.productName}</Link> : i.productName}<br /><span className="muted small">{i.sku}</span></td>
                      <td>{i.quantity}</td><td>{brl(i.unitPrice)}</td><td><b>{brl(i.subtotal)}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="totals">
              <div className="row"><span>Subtotal</span><span>{brl(o.subtotal)}</span></div>
              {o.discount > 0 && <div className="row discount"><span>Desconto {o.couponCode && `(${o.couponCode})`}</span><span>- {brl(o.discount)}</span></div>}
              <div className="row"><span>Frete</span><span>{brl(o.shipping)}</span></div>
              <div className="row total"><span>Total</span><span>{brl(o.total)}</span></div>
            </div>
          </div>
          <div className="panel">
            <h2 style={{ marginTop: 0 }}>📍 Entrega e pagamento</h2>
            <ul className="contact-list">
              <li><b>Cliente:</b> {o.customerName}</li>
              <li><b>Telefone:</b> {o.phone || '—'}</li>
              <li><b>Endereço:</b> {o.street}, {o.number}{o.complement ? ` — ${o.complement}` : ''}</li>
              <li><b>Bairro:</b> {o.neighborhood}</li>
              <li><b>Cidade:</b> {o.city}</li>
              <li><b>Pagamento:</b> {o.payment}</li>
              <li><b>Observações do cliente:</b> {o.notes || '—'}</li>
              <li><b>Estoque:</b> {o.stockDeducted ? 'já baixado' : 'ainda não baixado'}</li>
            </ul>
            {o.phone && (
              <a className="btn btn-whatsapp" href={whatsappLink(o.phone, `Olá ${o.customerName}! Sobre seu pedido ${orderCode(o.id)} na Secret Garden 🌸`)} target="_blank" rel="noopener noreferrer">
                Chamar cliente no WhatsApp
              </a>
            )}
          </div>
        </div>
        <OrderStatusForm id={o.id} status={o.status} internalNotes={o.internalNotes || ''} stockDeducted={o.stockDeducted} />
      </div>
    </>
  );
}
