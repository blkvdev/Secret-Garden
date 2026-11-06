import { brl, onlyDigits } from './format';

export const DEFAULT_TEMPLATE = `Olá! Gostaria de fazer um pedido 🌸

*Pedido:* {PEDIDO}

*Produtos:*
{PRODUTOS}

*Subtotal:* {SUBTOTAL}
*Desconto:* {DESCONTO}
*Frete:* {FRETE}
*Total:* {TOTAL}

 *ENTREGA*
*Nome:* {NOME}
*Telefone:* {TELEFONE}
*Cidade:* {CIDADE}
*Bairro:* {BAIRRO}
*Endereço:* {ENDERECO}
*Complemento:* {COMPLEMENTO}

 *Forma de pagamento:* {PAGAMENTO}

 *Observações:* {OBSERVACOES}

Gostaria de confirmar meu pedido. 😊`;

export const TEMPLATE_VARIABLES = [
  'PEDIDO', 'PRODUTOS', 'SUBTOTAL', 'DESCONTO', 'CUPOM', 'FRETE', 'TOTAL', 'NOME', 'TELEFONE',
  'CIDADE', 'BAIRRO', 'ENDERECO', 'COMPLEMENTO', 'PAGAMENTO', 'OBSERVACOES', 'PIX',
];

export function productLines(items: { name: string; quantity: number; unitPrice: number; subtotal: number }[]) {
  return items.map((i) => ` ${i.quantity}x ${i.name}\n   ${brl(i.unitPrice)} cada — subtotal ${brl(i.subtotal)}`).join('\n');
}

export function fillTemplate(template: string, vars: Record<string, string>) {
  const tpl = template && template.trim() ? template : DEFAULT_TEMPLATE;
  return tpl.replace(/\{([A-Z]+)\}/g, (m, key: string) => (key in vars ? vars[key] : m));
}

export function normalizeWhatsapp(number: string) {
  let d = onlyDigits(number);
  if (d.length === 10 || d.length === 11) d = `55${d}`;
  return d;
}

export function whatsappLink(number: string, message?: string) {
  return `https://wa.me/${normalizeWhatsapp(number)}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}
