import SectionTitle from '@/components/SectionTitle';
import { getSettings } from '@/lib/store';
import { whatsappLink } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export default async function ContactPage() {
  const s = await getSettings();
  const mapQ = s.mapQuery || s.address;
  return (
    <div className="container">
      <div className="page-title"><SectionTitle as="h1" caps="Encontre" script="nossa loja" sub="Será um prazer receber você" /></div>
      <div className="contact-grid">
        <div className="panel">
          <h2 className="caps" style={{ marginTop: 0, fontSize: '1rem' }}>{s.storeName}</h2>
          <ul className="contact-list">
            {s.address && <li>📍 {s.address}</li>}
            {s.hours && <li>🕒 {s.hours}</li>}
            {s.phone && <li>📞 <a href={`tel:${s.phone.replace(/[^\d+]/g, '')}`}>{s.phone}</a></li>}
            {s.email && <li>✉️ <a href={`mailto:${s.email}`}>{s.email}</a></li>}
            {s.instagram && <li>📷 <a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noopener noreferrer">@{s.instagram}</a></li>}
          </ul>
          {s.whatsapp && <a className="btn btn-whatsapp" href={whatsappLink(s.whatsapp, 'Olá! Vim pelo site 🌸')} target="_blank" rel="noopener noreferrer">Falar no WhatsApp</a>}
        </div>
        {mapQ ? (
          <iframe className="map" title="Mapa da loja" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={`https://www.google.com/maps?q=${encodeURIComponent(mapQ)}&output=embed`} />
        ) : <div className="panel">Endereço ainda não configurado.</div>}
      </div>
    </div>
  );
}
