import CouponManager from '@/components/admin/CouponManager';
import { db } from '@/lib/db';
import { toLocalInput } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function CouponsPage() {
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  return (
    <CouponManager
      coupons={coupons.map((c) => ({
        id: c.id, code: c.code, type: c.type, value: c.value, minValue: c.minValue, expiresAt: toLocalInput(c.expiresAt),
        usageLimit: c.usageLimit, used: c.used, active: c.active,
      }))}
    />
  );
}
