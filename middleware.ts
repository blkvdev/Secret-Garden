import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from './lib/session';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith('/api/');

  // Proteção CSRF: toda alteração precisa vir do próprio site
  if (isApi && req.method !== 'GET') {
    const origin = req.headers.get('origin');
    let ok = false;
    try {
      ok = !!origin && new URL(origin).host === req.headers.get('host');
    } catch {
      ok = false;
    }
    if (!ok) return NextResponse.json({ error: 'Origem inválida' }, { status: 403 });
  }

  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) return NextResponse.next();
  if (pathname === '/admin/login' || pathname === '/api/admin/login') return NextResponse.next();

  const adminId = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!adminId) {
    if (isApi) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = '';
    return NextResponse.redirect(url);
  }
  const res = NextResponse.next();
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}

export const config = { matcher: ['/admin/:path*', '/api/:path*'] };
