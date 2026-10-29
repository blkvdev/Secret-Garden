import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { badRequest, requireAdmin, unauthorized } from '@/lib/auth';
import { citySchema, firstError } from '@/lib/validators';

export async function POST(req: Request) {
  if (!(await requireAdmin())) return unauthorized();
  const parsed = citySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest(firstError(parsed.error));
  if (await db.deliveryCity.findUnique({ where: { name: parsed.data.name } })) return badRequest('Cidade já cadastrada');
  return NextResponse.json(await db.deliveryCity.create({ data: parsed.data }));
}
