import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { couponDiscount, couponProblem } from '@/lib/pricing';
import { clientIp, rateLimit } from '@/lib/rate-limit';

const schema = z.object({ code: z.string().trim().toUpperCase().min(1).max(30), subtotal: z.coerce.number().min(0).max(1000000) });

// Pré-visualização do cupom no carrinho (o valor final é recalculado no checkout)
export async function POST(req: Request) {
  if (!rateLimit(`coupon:${clientIp(req)}`, 20, 10 * 60_000).ok) return NextResponse.json({ error: 'Muitas tentativas. Aguarde.' }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Informe o cupom' }, { status: 400 });
  const c = await db.coupon.findUnique({ where: { code: parsed.data.code } });
  const problem = couponProblem(c, parsed.data.subtotal);
  if (problem || !c) return NextResponse.json({ error: problem }, { status: 400 });
  return NextResponse.json({ code: c.code, discount: couponDiscount(c, parsed.data.subtotal), label: c.type === 'PERCENT' ? `${c.value}% de desconto` : `R$ ${c.value.toFixed(2).replace('.', ',')} de desconto` });
}
