import { NextResponse } from 'next/server';
import { badRequest, requireAdmin, unauthorized } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { saveImage } from '@/lib/uploads';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();
  if (!rateLimit(`upload:${admin.id}`, 60, 60_000).ok) return badRequest('Muitos envios. Aguarde um minuto.', 429);
  const form = await req.formData().catch(() => null);
  if (!form) return badRequest('Envio inválido');
  const files = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return badRequest('Nenhuma imagem selecionada');
  if (files.length > 10) return badRequest('Envie no máximo 10 imagens por vez');
  try {
    const urls: string[] = [];
    for (const f of files) urls.push(await saveImage(f));
    return NextResponse.json({ urls });
  } catch (e) {
    return badRequest(e instanceof Error ? e.message : 'Falha no upload');
  }
}
