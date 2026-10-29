import { db } from './db';

export const productInclude = {
  images: { orderBy: { position: 'asc' as const } },
  category: { select: { name: true, slug: true } },
};

export const visible = { active: true, category: { active: true } };

export async function getSettings() {
  const s = await db.storeSetting.findUnique({ where: { id: 'store' } });
  return (
    s ?? {
      id: 'store', storeName: 'Secret Garden', logoUrl: null, announcement: '', heroTitle: 'Uma flor, mil significados',
      heroSubtitle: '', whatsapp: '', instagram: '', email: '', phone: '', address: '', mapQuery: '', hours: '', pixKey: '',
      paymentMethods: 'PIX,Dinheiro,Cartão', whatsappTemplate: '',
    }
  );
}

export async function getBanners(placement: 'TOPO' | 'MEIO') {
  const now = new Date();
  return db.banner.findMany({
    where: {
      placement,
      active: true,
      AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
  });
}
