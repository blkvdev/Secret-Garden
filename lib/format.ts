export function brl(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

export function mainImage(images: { url: string; position: number }[] | undefined) {
  if (!images || images.length === 0) return null;
  return [...images].sort((a, b) => a.position - b.position)[0].url;
}

export function slugify(text: string) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);
}

const TZ = 'America/Sao_Paulo';

export function formatDate(d: Date | string) {
  return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: TZ });
}

export function formatDay(d: Date | string) {
  return new Date(d).toLocaleDateString('pt-BR', { timeZone: TZ });
}

/** "2026-10-27" no fuso de Brasília */
export function dayKey(d: Date) {
  return new Date(d.getTime() - 3 * 3600_000).toISOString().slice(0, 10);
}

/** Date -> valor para <input type="datetime-local"> (horário de Brasília) */
export function toLocalInput(d: Date | string | null | undefined) {
  if (!d) return '';
  return new Date(new Date(d).getTime() - 3 * 3600_000).toISOString().slice(0, 16);
}

/** valor de <input type="datetime-local"> ou "date" (horário de Brasília) -> Date */
export function fromLocalInput(v: string | null | undefined, endOfDay = false): Date | null {
  if (!v) return null;
  const full = v.length === 10 ? `${v}T${endOfDay ? '23:59:59' : '00:00:00'}` : v.length === 16 ? `${v}:00` : v;
  const d = new Date(`${full}-03:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const onlyDigits = (s: string) => (s || '').replace(/\D/g, '');
