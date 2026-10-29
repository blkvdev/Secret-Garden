import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AdminNav from '@/components/admin/AdminNav';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { PENDING_STATUSES } from '@/lib/orders';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Admin — Secret Garden', robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) redirect('/admin/login');
  const pending = await db.order.count({ where: { status: { in: PENDING_STATUSES } } });
  return (
    <div className="admin-shell">
      <AdminNav email={admin.email} pending={pending} />
      <div className="admin-main">{children}</div>
    </div>
  );
}
