import { fromLocalInput } from './format';
import type { bannerSchema, promotionSchema } from './validators';
import type { z } from 'zod';

export function bannerData(d: z.infer<typeof bannerSchema>) {
  const startsAt = fromLocalInput(d.startsAt);
  const endsAt = fromLocalInput(d.endsAt);
  if (startsAt && endsAt && endsAt < startsAt) throw new Error('A data final precisa ser depois da inicial');
  return { ...d, startsAt, endsAt };
}

export function promoData(d: z.infer<typeof promotionSchema>) {
  const startsAt = fromLocalInput(d.startsAt);
  const endsAt = fromLocalInput(d.endsAt, true);
  if (!startsAt || !endsAt) throw new Error('Datas inválidas');
  if (endsAt <= startsAt) throw new Error('A data final precisa ser depois da inicial');
  const { productIds, ...rest } = d;
  return { data: { ...rest, startsAt, endsAt }, productIds: d.allProducts ? [] : productIds };
}
