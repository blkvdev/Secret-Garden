import BannerManager from '@/components/admin/BannerManager';
import { db } from '@/lib/db';
import { toLocalInput } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function BannersPage() {
  const now = new Date();
  const [banners, categories] = await Promise.all([
    db.banner.findMany({ orderBy: [{ placement: 'asc' }, { position: 'asc' }, { createdAt: 'desc' }] }),
    db.category.findMany({ where: { active: true }, orderBy: { position: 'asc' } }),
  ]);
  const links = [
    ...categories.map((c) => ({ label: c.name, href: `/categoria/${c.slug}` })),
    { label: 'Promoções', href: '/promocoes' },
    { label: 'Contato', href: '/contato' },
  ];
  return (
    <BannerManager
      links={links}
      banners={banners.map((b) => ({
        ...b, startsAt: toLocalInput(b.startsAt), endsAt: toLocalInput(b.endsAt),
        live: b.active && (!b.startsAt || b.startsAt <= now) && (!b.endsAt || b.endsAt >= now),
      }))}
    />
  );
}
