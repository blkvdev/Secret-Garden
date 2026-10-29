import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

try {
  process.loadEnvFile('.env');
} catch {
  /* sem .env */
}

const db = new PrismaClient();
const slugify = (t: string) =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'admin@secretgarden.com.br').toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 8) throw new Error('ADMIN_PASSWORD ausente no .env. Rode "npm run setup".');
  if (!(await db.admin.findUnique({ where: { email } }))) {
    await db.admin.create({ data: { email, passwordHash: await bcrypt.hash(password, 12) } });
    console.log('✔ Administrador criado');
  }

  for (const c of [
    { name: 'Buquês', slug: 'buques', position: 1 },
    { name: 'Flores', slug: 'flores', position: 2 },
    { name: 'Plantas', slug: 'plantas', position: 3 },
  ]) await db.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  const cat = Object.fromEntries((await db.category.findMany()).map((c) => [c.slug, c.id]));

  for (const c of [
    { name: 'Igaraçu do Tietê', fee: 5 },
    { name: 'Barra Bonita', fee: 8 },
    { name: 'Bebezinha', fee: 10 },
  ]) await db.deliveryCity.upsert({ where: { name: c.name }, update: {}, create: c });

  await db.storeSetting.upsert({
    where: { id: 'store' },
    update: {},
    create: {
      id: 'store',
      announcement: 'Entregamos em Igaraçu do Tietê, Barra Bonita e região 🌿',
      address: 'R. Geraldo García Guilhen, 09 - Nossa Gente, Igaraçu do Tietê - SP, 17350-000',
      mapQuery: 'R. Geraldo García Guilhen, 09, Igaraçu do Tietê - SP, 17350-000',
      hours: 'Segunda a sábado, das 8h às 18h',
      email: 'contato@secretgarden.com.br',
    },
  });

  if ((await db.product.count()) === 0) {
    const list = [
      { name: 'Buquê Primavera', sku: 'BQ-001', price: 59.9, stock: 10, cat: 'buques', featured: true, bestSeller: true },
      { name: 'Buquê Encanto Rosé', sku: 'BQ-002', price: 89.9, promoPrice: 79.9, stock: 6, cat: 'buques', featured: true },
      { name: 'Rosa Vermelha', sku: 'FL-001', price: 12, stock: 40, cat: 'flores', bestSeller: true },
      { name: 'Girassol', sku: 'FL-002', price: 19.99, stock: 25, cat: 'flores', featured: true, isNew: true },
      { name: 'Lírio Branco', sku: 'FL-003', price: 25, stock: 2, cat: 'flores', bestSeller: true },
      { name: 'Orquídea Phalaenopsis', sku: 'PL-001', price: 89.9, stock: 5, cat: 'plantas', isNew: true },
      { name: 'Suculenta Mini', sku: 'PL-002', price: 35, stock: 15, cat: 'plantas', isNew: true },
    ];
    for (const p of list) {
      await db.product.create({
        data: {
          name: p.name, slug: slugify(p.name), sku: p.sku, price: p.price, promoPrice: p.promoPrice ?? null, stock: p.stock,
          featured: !!p.featured, bestSeller: !!p.bestSeller, isNew: !!p.isNew, categoryId: cat[p.cat],
          description: 'Escolhida com carinho para transformar momentos especiais. Troque esta descrição e a foto pelo painel administrativo.',
          movements: { create: { change: p.stock, reason: 'Estoque inicial' } },
        },
      });
    }
    console.log('✔ Produtos de exemplo criados (sem foto — envie as fotos pelo admin)');
  }
}

main()
  .then(() => console.log('✔ Banco pronto!'))
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
