import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { badRequest, requireAdmin, unauthorized } from '@/lib/auth';
import { bannerData } from '@/lib/admin-data';
import { bannerSchema, firstError } from '@/lib/validators';

export async function POST(req: Request) {
  if (!(await requireAdmin())) return unauthorized();
  const parsed = bannerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(firstError(parsed.error));
  try {
    return NextResponse.json(await db.banner.create({ data: bannerData(parsed.data) }));
  } catch (e) {
    return badRequest(e instanceof Error ? e.message : 'Erro');
  }
}
