import { Prisma } from '@prisma/client';
import { db } from './db';
import { badRequest } from './auth';
import { slugify } from './format';

export async function uniqueSlug(name: string, ignoreId?: string) {
  const base = slugify(name) || 'produto';
  let slug = base;
  for (let i = 2; ; i++) {
    const found = await db.product.findUnique({ where: { slug } });
    if (!found || found.id === ignoreId) return slug;
    slug = `${base}-${i}`;
  }
}

export function prismaError(e: unknown, dup = 'Já existe um registro com esse código') {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return badRequest(dup);
  if (e instanceof Error && e.message) return badRequest(e.message);
  return badRequest('Não foi possível salvar');
}
