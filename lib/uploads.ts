import { mkdir, writeFile, unlink, readFile } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// As imagens ficam na pasta /uploads do projeto e são servidas por /api/images/...
export const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
export const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
export const SAFE_NAME = /^[a-f0-9-]{36}\.(jpg|png|webp|gif)$/;
export const IMAGE_URL = /^\/api\/images\/[a-f0-9-]{36}\.(jpg|png|webp|gif)$/;

const MIME: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };

/** Confere o tipo REAL do arquivo pelos primeiros bytes (não confia na extensão). */
function detectType(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  if (buf.subarray(0, 3).toString('ascii') === 'GIF') return 'gif';
  return null;
}

export async function saveImage(file: File) {
  if (file.size > MAX_IMAGE_SIZE) throw new Error(`"${file.name}" tem mais de 8 MB.`);
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = detectType(buf);
  if (!ext) throw new Error(`"${file.name}" não é uma imagem válida. Use JPG, PNG, WEBP ou GIF.`);
  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${crypto.randomUUID()}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, name), buf);
  return `/api/images/${name}`;
}

export async function readImage(name: string) {
  if (!SAFE_NAME.test(name)) return null;
  try {
    return { data: await readFile(path.join(UPLOAD_DIR, name)), mime: MIME[name.split('.').pop() as string] };
  } catch {
    return null;
  }
}

export async function deleteImageFile(url: string | null | undefined) {
  if (!url || !IMAGE_URL.test(url)) return;
  await unlink(path.join(UPLOAD_DIR, url.replace('/api/images/', ''))).catch(() => undefined);
}
