export const ORDER_STATUSES = [
  { value: 'INICIADO', label: 'Pedido iniciado' },
  { value: 'ENVIADO_WHATSAPP', label: 'Enviado para WhatsApp' },
  { value: 'AGUARDANDO_CONFIRMACAO', label: 'Aguardando confirmação' },
  { value: 'CONFIRMADO', label: 'Venda confirmada' },
  { value: 'EM_PREPARACAO', label: 'Em preparação' },
  { value: 'SAIU_PARA_ENTREGA', label: 'Saiu para entrega' },
  { value: 'ENTREGUE', label: 'Entregue' },
  { value: 'CANCELADO', label: 'Cancelado' },
] as const;

export const STATUS_VALUES = ORDER_STATUSES.map((s) => s.value) as string[];

/** Status em que a venda está concluída (conta no faturamento e baixa o estoque). */
export const SOLD_STATUSES = ['CONFIRMADO', 'EM_PREPARACAO', 'SAIU_PARA_ENTREGA', 'ENTREGUE'];
export const PENDING_STATUSES = ['INICIADO', 'ENVIADO_WHATSAPP', 'AGUARDANDO_CONFIRMACAO'];

export const statusLabel = (v: string) => ORDER_STATUSES.find((s) => s.value === v)?.label ?? v;
export const orderCode = (id: number) => `SG-${String(id).padStart(5, '0')}`;
