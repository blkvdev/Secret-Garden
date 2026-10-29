import CityManager from '@/components/admin/CityManager';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function DeliveryPage() {
  const cities = await db.deliveryCity.findMany({ orderBy: { name: 'asc' } });
  return (
    <>
      <h1>Entrega e frete</h1>
      <p className="muted">O cliente escolhe a cidade no carrinho e o frete é somado automaticamente ao total e à mensagem do WhatsApp.</p>
      <CityManager cities={cities} />
    </>
  );
}
