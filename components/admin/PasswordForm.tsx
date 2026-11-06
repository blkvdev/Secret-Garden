'use client';

import { useState } from 'react';
import { api } from './api';

export default function PasswordForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirmPwd) return setMsg({ ok: false, text: 'A confirmação não confere' });
    try { await api('/api/admin/password', 'PUT', { current, next }); setMsg({ ok: true, text: 'Senha alterada!' }); setCurrent(''); setNext(''); setConfirmPwd(''); }
    catch (err) { setMsg({ ok: false, text: err instanceof Error ? err.message : 'Erro' }); }
  }
  return (
    <form onSubmit={save} className="panel">
      <h2 style={{ marginTop: 0 }}> Trocar senha</h2>
      <div className="field"><label>Senha atual</label><input type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} /></div>
      <div className="field"><label>Nova senha (mín. 10 caracteres)</label><input type="password" required minLength={10} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} /></div>
      <div className="field"><label>Confirmar nova senha</label><input type="password" required autoComplete="new-password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} /></div>
      {msg && <p className={`alert ${msg.ok ? 'alert-ok' : 'alert-error'}`}>{msg.text}</p>}
      <button className="btn btn-sm">Alterar senha</button>
    </form>
  );
}
