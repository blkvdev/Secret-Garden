import { z } from 'zod';
import { IMAGE_URL } from './uploads';

const money = z.coerce.number().positive('Valor deve ser maior que zero').max(100000);
const imageUrl = z.string().regex(IMAGE_URL, 'Imagem inválida');
const dateStr = z.string().trim().max(25);

export const productSchema = z
  .object({
    name: z.string().trim().min(2, 'Nome muito curto').max(120),
    description: z.string().trim().max(5000).default(''),
    price: money,
    promoPrice: z.union([money, z.null()]).optional(),
    sku: z.string().trim().min(1, 'Informe o SKU').max(60),
    stock: z.coerce.number().int().min(0).max(100000).optional(),
    minStock: z.coerce.number().int().min(0).max(100000).default(3),
    categoryId: z.string().min(1, 'Escolha a categoria'),
    active: z.boolean(),
    featured: z.boolean(),
    bestSeller: z.boolean(),
    isNew: z.boolean(),
    images: z.array(imageUrl).max(12, 'Máximo de 12 imagens'),
  })
  .refine((d) => d.promoPrice == null || d.promoPrice < d.price, { message: 'O preço promocional precisa ser menor que o preço normal', path: ['promoPrice'] });

// link interno ("/categoria/buques") ou externo https
const link = z.string().trim().max(300).refine((v) => v === '' || v.startsWith('/') || /^https:\/\//.test(v), 'Link deve começar com / ou https://');

export const bannerSchema = z.object({
  title: z.string().trim().max(120).default(''),
  subtitle: z.string().trim().max(250).default(''),
  buttonText: z.string().trim().max(40).default(''),
  link,
  imageUrl,
  placement: z.enum(['TOPO', 'MEIO']),
  position: z.coerce.number().int().min(0).max(999).default(0),
  active: z.boolean(),
  startsAt: dateStr.optional().default(''),
  endsAt: dateStr.optional().default(''),
});

export const promotionSchema = z
  .object({
    name: z.string().trim().min(2, 'Dê um nome para a promoção').max(80),
    type: z.enum(['PERCENT', 'FIXED']),
    value: z.coerce.number().positive('Informe o desconto').max(100000),
    startsAt: dateStr.min(10, 'Informe o início'),
    endsAt: dateStr.min(10, 'Informe o fim'),
    active: z.boolean(),
    allProducts: z.boolean(),
    productIds: z.array(z.string().max(50)).max(500),
  })
  .refine((d) => d.type !== 'PERCENT' || d.value < 100, { message: 'Desconto percentual precisa ser menor que 100%', path: ['value'] })
  .refine((d) => d.allProducts || d.productIds.length > 0, { message: 'Escolha os produtos ou marque "loja toda"', path: ['productIds'] });

export const couponSchema = z
  .object({
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, 'Código: 3 a 30 letras/números, sem espaço'),
    type: z.enum(['PERCENT', 'FIXED']),
    value: z.coerce.number().positive('Informe o desconto').max(100000),
    minValue: z.coerce.number().min(0).max(100000).default(0),
    expiresAt: dateStr.optional().default(''),
    usageLimit: z.union([z.coerce.number().int().min(1).max(1000000), z.null()]).optional(),
    active: z.boolean(),
  })
  .refine((d) => d.type !== 'PERCENT' || d.value <= 100, { message: 'Máximo de 100%', path: ['value'] });

export const settingsSchema = z.object({
  storeName: z.string().trim().min(2).max(80),
  logoUrl: imageUrl.nullable(),
  announcement: z.string().trim().max(200),
  heroTitle: z.string().trim().max(160),
  heroSubtitle: z.string().trim().max(300),
  whatsapp: z.string().trim().max(25).refine((v) => v === '' || /^\d{10,15}$/.test(v.replace(/\D/g, '')), 'WhatsApp inválido (use DDD + número)'),
  instagram: z.string().trim().max(60),
  email: z.union([z.literal(''), z.string().trim().email('E-mail inválido').max(120)]),
  phone: z.string().trim().max(30),
  address: z.string().trim().max(250),
  mapQuery: z.string().trim().max(250),
  hours: z.string().trim().max(250),
  pixKey: z.string().trim().max(120),
  paymentMethods: z.string().trim().min(1, 'Informe pelo menos uma forma de pagamento').max(200),
  whatsappTemplate: z.string().max(4000),
});

export const citySchema = z.object({ name: z.string().trim().min(2).max(80), fee: z.coerce.number().min(0).max(1000), active: z.boolean() });

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  active: z.boolean().default(true),
  position: z.coerce.number().int().min(0).max(999).default(0),
});

const text = (max: number) => z.string().trim().max(max);

export const checkoutSchema = z.object({
  items: z.array(z.object({ id: z.string().min(1).max(50), quantity: z.coerce.number().int().min(1).max(999) })).min(1, 'Carrinho vazio').max(50),
  coupon: z.string().trim().toUpperCase().max(30).optional().default(''),
  customer: z.object({
    name: text(80).min(2, 'Informe seu nome'),
    phone: text(25).optional().default(''),
    city: text(80).min(2, 'Escolha a cidade'),
    neighborhood: text(80).min(2, 'Informe o bairro'),
    street: text(150).min(3, 'Informe o endereço'),
    number: text(15).min(1, 'Informe o número'),
    complement: text(120).optional().default(''),
    payment: text(40).min(2, 'Escolha a forma de pagamento'),
    notes: text(500).optional().default(''),
  }),
});

export const firstError = (err: z.ZodError) => err.issues[0]?.message ?? 'Dados inválidos';
