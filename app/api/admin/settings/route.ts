import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { badRequest, requireAdmin, unauthorized } from '@/lib/auth';
import { deleteImageFile } from '@/lib/uploads';
import { firstError, settingsSchema } from '@/lib/validators';
import { normalizeWhatsapp } from '@/lib/whatsapp';

export async function PUT(req: Request) {
  if (!(await requireAdmin())) return unauthorized();
  const parsed = settingsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(firstError(parsed.error));
  const data = {
    ...parsed.data,
    whatsapp: parsed.data.whatsapp ? normalizeWhatsapp(parsed.data.whatsapp) : '',
    instagram: parsed.data.instagram.replace(/^@/, '').replace(/[^a-zA-Z0-9._]/g, ''),
    paymentMethods: parsed.data.paymentMethods.split(',').map((s) => s.trim()).filter(Boolean).join(','),
  };
  const old = await db.storeSetting.findUnique({ where: { id: 'store' } });
  await db.storeSetting.upsert({ where: { id: 'store' }, update: data, create: { id: 'store', ...data } });
  if (old?.logoUrl && old.logoUrl !== data.logoUrl) await deleteImageFile(old.logoUrl);
  return NextResponse.json({ ok: true });
}
