import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { badRequest, requireAdmin, unauthorized } from '@/lib/auth';

const schema = z.object({
  mode: z.enum(['add', 'remove', 'set']),
  quantity: z.coerce.number().int().min(0).max(100000),
  reason: z.string().trim().max(120).optional().default(''),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest('Quantidade inválida');
  const { mode, quantity, reason } = parsed.data;
  const product = await db.product.findUnique({ where: { id } });
  if (!product) return badRequest('Produto não encontrado', 404);
  const newStock = mode === 'add' ? product.stock + quantity : mode === 'remove' ? product.stock - quantity : quantity;
  if (newStock < 0) return badRequest('O estoque não pode ficar negativo');
  const change = newStock - product.stock;
  if (change === 0) return NextResponse.json({ stock: product.stock });
  const label = { add: 'Entrada de estoque', remove: 'Saída de estoque', set: 'Ajuste de estoque' }[mode];
  await db.$transaction([
    db.product.update({ where: { id }, data: { stock: newStock } }),
    db.inventoryMovement.create({ data: { productId: id, change, reason: reason ? `${label}: ${reason}` : label } }),
  ]);
  return NextResponse.json({ stock: newStock });
}
