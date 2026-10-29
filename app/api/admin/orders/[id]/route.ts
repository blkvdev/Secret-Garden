import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { badRequest, requireAdmin, unauthorized } from '@/lib/auth';
import { SOLD_STATUSES, STATUS_VALUES, orderCode } from '@/lib/orders';

const schema = z.object({
  status: z.string().refine((s) => STATUS_VALUES.includes(s), 'Status inválido'),
  internalNotes: z.string().trim().max(2000).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return unauthorized();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return badRequest('Pedido inválido');
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? 'Dados inválidos');
  const { status, internalNotes } = parsed.data;

  try {
    const result = await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
      if (!order) throw new Error('Pedido não encontrado');
      let stockDeducted = order.stockDeducted;
      let soldAt = order.soldAt;
      const sold = SOLD_STATUSES.includes(status);

      // VENDA CONCLUÍDA: baixa o estoque e marca a data da venda
      if (sold && !order.stockDeducted) {
        for (const item of order.items) {
          if (!item.productId) continue;
          const p = await tx.product.findUnique({ where: { id: item.productId } });
          if (!p) continue;
          if (p.stock < item.quantity) {
            throw new Error(`Estoque insuficiente de "${p.name}" (tem ${p.stock}, o pedido pede ${item.quantity}). Ajuste o estoque antes.`);
          }
          await tx.product.update({ where: { id: p.id }, data: { stock: { decrement: item.quantity } } });
          await tx.inventoryMovement.create({ data: { productId: p.id, change: -item.quantity, reason: `Venda ${orderCode(id)}`, orderId: id } });
        }
        stockDeducted = true;
        soldAt = soldAt ?? new Date();
      }

      // voltou atrás / cancelou: devolve o estoque e tira do faturamento
      if (!sold && order.stockDeducted) {
        for (const item of order.items) {
          if (!item.productId) continue;
          if (!(await tx.product.findUnique({ where: { id: item.productId } }))) continue;
          await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
          await tx.inventoryMovement.create({
            data: { productId: item.productId, change: item.quantity, reason: `Estorno ${orderCode(id)} (${status.toLowerCase()})`, orderId: id },
          });
        }
        stockDeducted = false;
        soldAt = null;
      }

      return tx.order.update({
        where: { id },
        data: { status, stockDeducted, soldAt, ...(internalNotes !== undefined ? { internalNotes: internalNotes || null } : {}) },
      });
    });
    return NextResponse.json({ ok: true, status: result.status });
  } catch (e) {
    return badRequest(e instanceof Error ? e.message : 'Falha ao atualizar');
  }
}
