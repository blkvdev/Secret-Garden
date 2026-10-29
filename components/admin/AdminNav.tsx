'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const GROUPS = [
  { title: 'Vendas', links: [{ href: '/admin', label: '📊 Dashboard' }, { href: '/admin/pedidos', label: '🧾 Pedidos' }] },
  { title: 'Catálogo', links: [{ href: '/admin/produtos', label: '🌷 Produtos' }, { href: '/admin/categorias', label: '🗂️ Categorias' }] },
  { title: 'Marketing', links: [{ href: '/admin/banners', label: '🖼️ Banners' }, { href: '/admin/promocoes', label: '🏷️ Promoções' }, { href: '/admin/cupons', label: '🎟️ Cupons' }] },
  { title: 'Loja', links: [{ href: '/admin/entrega', label: '🚚 Entrega / Frete' }, { href: '/admin/configuracoes', label: '⚙️ Configurações' }] },
];

export default function AdminNav({ email, pending }: { email: string; pending: number }) {
  const path = usePathname();
  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }
  return (
    <aside className="sidebar">
      <div className="brand"><img src="/logo.png" alt="Secret Garden" /></div>
      {GROUPS.map((g) => (
        <div key={g.title} style={{ display: 'contents' }}>
          <div className="group">{g.title}</div>
          {g.links.map((l) => (
            <Link key={l.href} href={l.href} className={(l.href === '/admin' ? path === l.href : path.startsWith(l.href)) ? 'active' : ''}>
              {l.label}
              {l.href === '/admin/pedidos' && pending > 0 && <span className="status status-wait" style={{ marginLeft: 8 }}>{pending}</span>}
            </Link>
          ))}
        </div>
      ))}
      <div className="spacer" />
      <a href="/" target="_blank" rel="noopener noreferrer">↗ Ver loja</a>
      <button type="button" onClick={logout} title={email}>🚪 Sair</button>
    </aside>
  );
}
