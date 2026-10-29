import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { brl, round2 } from '@/lib/format';
import { orderCode } from '@/lib/orders';
import { couponDiscount, couponProblem, getActivePromotions, priceFor } from '@/lib/pricing';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { checkoutSchema, firstError } from '@/lib/validators';
import { fillTemplate, productLines, whatsappLink } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

const paymentList = (raw: string) => raw.split(',').map((s) => s.trim()).filter(Boolean);

export async function GET() {
  const [cities, settings, coupons] = await Promise.all([
    db.deliveryCity.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { id: true, name: true, fee: true } }),
    db.storeSetting.findUnique({ where: { id: 'store' } }),
    db.coupon.count({ where: { active: true } }),
  ]);
  return NextResponse.json({ cities, payments: paymentList(settings?.paymentMethods || 'PIX,Dinheiro,Cartão'), hasCoupons: coupons > 0 });
}

export async function POST(req: Request) {
  if (!rateLimit(`checkout:${clientIp(req)}`, 10, 10 * 60_000).ok) {
    return NextResponse.json({ error: 'Muitos pedidos em sequência. Aguarde alguns minutos.' }, { status: 429 });
  }
  const parsed = checkoutSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  const { items, customer, coupon } = parsed.data;

  const settings = await db.storeSetting.findUnique({ where: { id: 'store' } });
  if (!settings?.whatsapp) return NextResponse.json({ error: 'A loja ainda não configurou o WhatsApp. Tente mais tarde.' }, { status: 503 });
  if (!paymentList(settings.paymentMethods).includes(customer.payment)) return NextResponse.json({ error: 'Forma de pagamento inválida' }, { status: 400 });

  const city = await db.deliveryCity.findFirst({ where: { name: customer.city, active: true } });
  if (!city) return NextResponse.json({ error: 'Não entregamos nessa cidade' }, { status: 400 });

  const qtyById = new Map<string, number>();
  for (const i of items) qtyById.set(i.id, (qtyById.get(i.id) || 0) + i.quantity);

  const products = await db.product.findMany({ where: { id: { in: [...qtyById.keys()] }, active: true, category: { active: true } } });
  if (products.length !== qtyById.size) {
    return NextResponse.json({ error: 'Algum produto do carrinho não está mais disponível. Atualize o carrinho.' }, { status: 409 });
  }

  // PREÇOS SEMPRE CALCULADOS NO SERVIDOR (inclui promoções ativas)
  const promos = await getActivePromotions();
  const lines = products.map((p) => {
    const quantity = qtyById.get(p.id)!;
    const unitPrice = priceFor(p, promos).finalPrice;
    return { product: p, quantity, unitPrice, subtotal: round2(unitPrice * quantity) };
  });
  const noStock = lines.find((l) => l.quantity > l.product.stock);
  if (noStock) return NextResponse.json({ error: `Só temos ${noStock.product.stock} unidade(s) de "${noStock.product.name}".` }, { status: 409 });

  const subtotal = round2(lines.reduce((s, l) => s + l.subtotal, 0));
  const shipping = round2(city.fee);

  try {
    // pedido + uso do cupom na mesma transação
    const order = await db.$transaction(async (tx) => {
      let discount = 0;
      let couponCode: string | null = null;
      if (coupon) {
        const c = await tx.coupon.findUnique({ where: { code: coupon } });
        const problem = couponProblem(c, subtotal);
        if (problem || !c) throw new Error(problem || 'Cupom inválido');
        discount = couponDiscount(c, subtotal);
        couponCode = c.code;
        await tx.coupon.update({ where: { id: c.id }, data: { used: { increment: 1 } } });
      }
      return tx.order.create({
        data: {
          customerName: customer.name, phone: customer.phone || null, city: city.name, neighborhood: customer.neighborhood,
          street: customer.street, number: customer.number, complement: customer.complement || null, payment: customer.payment,
          notes: customer.notes || null, subtotal, discount, couponCode, shipping, total: round2(subtotal - discount + shipping),
          status: 'ENVIADO_WHATSAPP',
          items: {
            create: lines.map((l) => ({
              productId: l.product.id, productName: l.product.name, sku: l.product.sku, quantity: l.quantity, unitPrice: l.unitPrice, subtotal: l.subtotal,
            })),
          },
        },
      });
    });

    const message = fillTemplate(settings.whatsappTemplate, {
      PEDIDO: orderCode(order.id),
      PRODUTOS: productLines(lines.map((l) => ({ name: l.product.name, quantity: l.quantity, unitPrice: l.unitPrice, subtotal: l.subtotal }))),
      SUBTOTAL: brl(subtotal),
      DESCONTO: order.discount > 0 ? `- ${brl(order.discount)}${order.couponCode ? ` (cupom ${order.couponCode})` : ''}` : '-',
      CUPOM: order.couponCode || '-',
      FRETE: shipping > 0 ? brl(shipping) : 'Grátis',
      TOTAL: brl(order.total),
      NOME: customer.name,
      TELEFONE: customer.phone || '-',
      CIDADE: city.name,
      BAIRRO: customer.neighborhood,
      ENDERECO: `${customer.street}, ${customer.number}`,
      COMPLEMENTO: customer.complement || '-',
      PAGAMENTO: customer.payment,
      OBSERVACOES: customer.notes || '-',
      PIX: settings.pixKey || '-',
    });
    return NextResponse.json({ order: orderCode(order.id), whatsappUrl: whatsappLink(settings.whatsapp, message) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Não foi possível registrar o pedido' }, { status: 400 });
  }
}
