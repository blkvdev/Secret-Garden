'use client';

import { useRef, useState } from 'react';
import { uploadImages } from './api';

// Escolher UMA imagem do computador/celular (logo, banner…)
export default function ImagePicker({ label, value, onChange, wide, allowRemove = true }: { label: string; value: string | null; onChange: (v: string | null) => void; wide?: boolean; allowRemove?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function pick(files: FileList | null) {
    if (!files?.[0]) return;
    setBusy(true); setErr('');
    try { onChange((await uploadImages([files[0]]))[0]); } catch (e) { setErr(e instanceof Error ? e.message : 'Erro'); } finally { setBusy(false); }
  }
  return (
    <div className="field">
      <span>{label}</span>
      {wide ? (
        <img className="banner-preview" src={value || '/placeholder.svg'} alt="" />
      ) : null}
      <div className="single-img">
        {!wide && <img src={value || '/placeholder.svg'} alt="" style={{ objectFit: 'contain' }} />}
        <button type="button" className="btn btn-sm btn-outline" onClick={() => ref.current?.click()} disabled={busy}>
          {busy ? 'Enviando…' : value ? 'Alterar imagem' : 'Escolher imagem'}
        </button>
        {value && allowRemove && <button type="button" className="link-btn" onClick={() => onChange(null)}>Remover</button>}
      </div>
      {err && <span className="alert alert-error">{err}</span>}
      <input ref={ref} type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => { pick(e.target.files); e.target.value = ''; }} />
    </div>
  );
}
