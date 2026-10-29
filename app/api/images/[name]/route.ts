import { readImage } from '@/lib/uploads';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const img = await readImage(name);
  if (!img) return new Response('Imagem não encontrada', { status: 404 });
  return new Response(new Uint8Array(img.data), {
    headers: { 'Content-Type': img.mime, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' },
  });
}
