'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from './api';
import ImagePicker from './ImagePicker';

export type BannerRow = {
  id: string; title: string; subtitle: string; buttonText: string; link: string; imageUrl: string;
  placement: string; position: number; active: boolean; startsAt: string; endsAt: string; live: boolean;
};

const EMPTY = { title: '', subtitle: '', buttonText: '', link: '', imageUrl: '', placement: 'TOPO', position: '0', active: true, startsAt: '', endsAt: '' };

export default function BannerManager({ banners, links }: { banners: BannerRow[]; links: { label: string; href: string }[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null); // id | 'new' | null
  const [f, setF] = useState(EMPTY);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const open = (b?: BannerRow) => {
    setMsg(null);
    if (b) { setEditing(b.id); setF({ ...b, position: String(b.position) }); }
    else { setEditing('new'); setF({ ...EMPTY, position: String(banners.length + 1) }); }
    setTimeout(() => document.getElementById('banner-form')?.scrollIntoView({ behavior: 'smooth' }), 50);
  };
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const t = e.target as HTMLInputElement;
    setF((x) => ({ ...x, [k]: t.type === 'checkbox' ? t.checked : t.value }));
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f.imageUrl) return setMsg({ ok: false, text: 'Escolha a imagem do banner' });
    setBusy(true); setMsg(null);
    try {
      const body = { ...f, position: Number(f.position) || 0 };
      if (editing === 'new') await api('/api/admin/banners', 'POST', body);
      else await api(`/api/admin/banners/${editing}`, 'PUT', body);
      setEditing(null);
      router.refresh();
    } catch (err) { setMsg({ ok: false, text: err instanceof Error ? err.message : 'Erro' }); }
    finally { setBusy(false); }
  }

  async function toggle(b: BannerRow) {
    await api(`/api/admin/banners/${b.id}`, 'PUT', { ...b, active: !b.active }).catch((e) => alert(e.message));
    router.refresh();
  }
  async function del(b: BannerRow) {
    if (!confirm('Excluir este banner?')) return;
    await api(`/api/admin/banners/${b.id}`, 'DELETE').catch((e) => alert(e.message));
    if (editing === b.id) setEditing(null);
    router.refresh();
  }

  const group = (p: string) => banners.filter((b) => b.placement === p);

  return (
    <>
      <div className="page-head">
        <h1>Banners</h1>
        <button type="button" className="btn" onClick={() => open()}>+ Novo banner</button>
      </div>
      <p className="muted">
        <b>Topo</b>: carrossel de ponta a ponta no início do site (troca sozinho a cada 6 s). <b>Meio</b>: faixas largas entre as seções da home.
        Tamanho ideal da imagem: <b>1920 × 800 px</b> (topo) e <b>1920 × 600 px</b> (meio).
      </p>

      {['TOPO', 'MEIO'].map((p) => (
        <div key={p} style={{ marginBottom: 26 }}>
          <h2>{p === 'TOPO' ? ' Banner principal (topo)' : 'Faixas do meio'}</h2>
          {group(p).map((b) => (
            <div className="list-card" key={b.id}>
              <img src={b.imageUrl} alt="" />
              <div>
                <h3>{b.title || <span className="muted">(sem texto)</span>}</h3>
                <p className="muted small" style={{ margin: 0 }}>{b.subtitle}</p>
                <p className="small" style={{ margin: '6px 0 0' }}>
                  <span className={`status ${b.live ? 'status-on' : b.active ? 'status-wait' : 'status-off'}`}>{b.live ? 'No ar' : b.active ? 'Agendado / expirado' : 'Desativado'}</span>
                  {' '}<span className="muted">ordem {b.position}{b.startsAt && ` · de ${b.startsAt.replace('T', ' ')}`}{b.endsAt && ` até ${b.endsAt.replace('T', ' ')}`}</span>
                </p>
              </div>
              <div className="quick-actions">
                <button type="button" className="btn btn-sm btn-outline" onClick={() => open(b)}>Editar</button>
                <button type="button" className="btn btn-sm btn-outline" onClick={() => toggle(b)}>{b.active ? 'Desativar' : 'Ativar'}</button>
                <button type="button" className="link-btn" onClick={() => del(b)}>Excluir</button>
              </div>
            </div>
          ))}
          {!group(p).length && <p className="muted small">{p === 'TOPO' ? 'Nenhum banner — o site mostra a logo no topo.' : 'Nenhuma faixa cadastrada.'}</p>}
        </div>
      ))}

      {editing && (
        <form id="banner-form" className="panel" onSubmit={save}>
          <h2 style={{ marginTop: 0 }}>{editing === 'new' ? 'Novo banner' : 'Editar banner'}</h2>
          <ImagePicker wide allowRemove={false} label="Imagem *" value={f.imageUrl || null} onChange={(v) => setF((x) => ({ ...x, imageUrl: v || '' }))} />
          <div className="form-grid">
            <div className="field">
              <label>Onde aparece</label>
              <select value={f.placement} onChange={set('placement')}><option value="TOPO">Topo (carrossel principal)</option><option value="MEIO">Meio da página</option></select>
            </div>
            <div className="field"><label>Ordem</label><input type="number" min={0} value={f.position} onChange={set('position')} /></div>
            <div className="field span-2"><label>Título (letra manuscrita)</label><input maxLength={120} placeholder="Dia das Mães" value={f.title} onChange={set('title')} /></div>
            <div className="field span-2"><label>Subtítulo</label><input maxLength={250} placeholder="Até 20% off em buquês selecionados" value={f.subtitle} onChange={set('subtitle')} /></div>
            <div className="field"><label>Texto do botão</label><input maxLength={40} placeholder="Comprar agora" value={f.buttonText} onChange={set('buttonText')} /></div>
            <div className="field">
              <label>Link do botão</label>
              <input list="banner-links" maxLength={300} placeholder="/categoria/buques" value={f.link} onChange={set('link')} />
              <datalist id="banner-links">{links.map((l) => <option key={l.href} value={l.href}>{l.label}</option>)}</datalist>
            </div>
            <div className="field"><label>Mostrar a partir de (opcional)</label><input type="datetime-local" value={f.startsAt} onChange={set('startsAt')} /></div>
            <div className="field"><label>Mostrar até (opcional)</label><input type="datetime-local" value={f.endsAt} onChange={set('endsAt')} /></div>
          </div>
          <div className="checks"><label><input type="checkbox" checked={f.active} onChange={set('active')} /> Ativo</label></div>
          <p className="muted small">Dica: se a imagem já tem texto escrito, deixe título, subtítulo e botão vazios. O banner inteiro vira clicável se tiver link.</p>
          {msg && <p className={`alert ${msg.ok ? 'alert-ok' : 'alert-error'}`}>{msg.text}</p>}
          <div className="quick-actions">
            <button className="btn" disabled={busy}>{busy ? 'Salvando…' : 'Salvar banner'}</button>
            <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancelar</button>
          </div>
        </form>
      )}
    </>
  );
}
