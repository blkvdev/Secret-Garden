'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from './api';
import ImagePicker from './ImagePicker';

export type Settings = {
  storeName: string; logoUrl: string | null; announcement: string; heroTitle: string; heroSubtitle: string;
  whatsapp: string; instagram: string; email: string; phone: string; address: string; mapQuery: string;
  hours: string; pixKey: string; paymentMethods: string; whatsappTemplate: string;
};

export default function SettingsForm({ initial, defaultTemplate, variables }: { initial: Settings; defaultTemplate: string; variables: string[] }) {
  const router = useRouter();
  const [s, setS] = useState<Settings>({ ...initial, whatsappTemplate: initial.whatsappTemplate || defaultTemplate });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setS((x) => ({ ...x, [k]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try { await api('/api/admin/settings', 'PUT', s); setMsg({ ok: true, text: 'Configurações salvas! Já valem no site e nos próximos pedidos.' }); router.refresh(); }
    catch (err) { setMsg({ ok: false, text: err instanceof Error ? err.message : 'Erro' }); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={save} className="panel">
      <h2 style={{ marginTop: 0 }}> Loja</h2>
      <div className="form-grid">
        <div className="field span-2"><label>Nome da floricultura</label><input required value={s.storeName} onChange={set('storeName')} /></div>
        <div className="span-2"><ImagePicker label="Logo (vazio = logo padrão Secret Garden). Use PNG com fundo transparente." value={s.logoUrl} onChange={(v) => setS((x) => ({ ...x, logoUrl: v }))} /></div>
        <div className="field span-2"><label>Faixa de aviso no topo (vazio = esconde)</label><input maxLength={200} placeholder="Frete grátis em Igaraçu do Tietê " value={s.announcement} onChange={set('announcement')} /></div>
      </div>

      <h2> Texto da página inicial</h2>
      <p className="muted small" style={{ marginTop: 0 }}>Aparece no topo <b>somente quando não houver banner</b> cadastrado em Marketing → Banners.</p>
      <div className="form-grid">
        <div className="field span-2"><label>Título</label><input value={s.heroTitle} onChange={set('heroTitle')} /></div>
        <div className="field span-2"><label>Subtítulo</label><input value={s.heroSubtitle} onChange={set('heroSubtitle')} /></div>
      </div>

      <h2> WhatsApp e pagamento</h2>
      <div className="form-grid">
        <div className="field"><label>WhatsApp da loja (com DDD)</label><input inputMode="tel" placeholder="14 99999-9999" value={s.whatsapp} onChange={set('whatsapp')} /></div>
        <div className="field"><label>Chave PIX</label><input value={s.pixKey} onChange={set('pixKey')} /></div>
        <div className="field span-2"><label>Formas de pagamento (separadas por vírgula)</label><input value={s.paymentMethods} onChange={set('paymentMethods')} /></div>
        <div className="field span-2">
          <label>Modelo da mensagem do pedido</label>
          <textarea rows={16} value={s.whatsappTemplate} onChange={set('whatsappTemplate')} style={{ fontFamily: 'monospace', fontSize: '.88rem' }} />
          <span className="muted small" style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 300 }}>Variáveis: {variables.map((v) => <code key={v} style={{ marginRight: 4 }}>{`{${v}}`}</code>)}</span>
          <button type="button" className="link-btn" style={{ alignSelf: 'flex-start' }} onClick={() => setS((x) => ({ ...x, whatsappTemplate: defaultTemplate }))}>Restaurar modelo padrão</button>
        </div>
      </div>

      <h2> Contato</h2>
      <div className="form-grid">
        <div className="field"><label>Instagram (sem @)</label><input value={s.instagram} onChange={set('instagram')} /></div>
        <div className="field"><label>Telefone</label><input value={s.phone} onChange={set('phone')} /></div>
        <div className="field"><label>E-mail</label><input type="email" value={s.email} onChange={set('email')} /></div>
        <div className="field"><label>Horário de funcionamento</label><input value={s.hours} onChange={set('hours')} /></div>
        <div className="field span-2"><label>Endereço</label><input value={s.address} onChange={set('address')} /></div>
        <div className="field span-2"><label>Endereço para o mapa (vazio = usa o de cima)</label><input value={s.mapQuery} onChange={set('mapQuery')} /></div>
      </div>
      {msg && <p className={`alert ${msg.ok ? 'alert-ok' : 'alert-error'}`}>{msg.text}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Salvando…' : 'Salvar configurações'}</button>
    </form>
  );
}
