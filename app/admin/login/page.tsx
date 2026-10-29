'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    if (res.ok) { window.location.href = '/admin'; return; }
    const data = await res.json().catch(() => ({}));
    setError(data.error || 'Falha no login');
    setLoading(false);
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <img src="/logo.png" alt="Secret Garden" />
        <form className="panel" onSubmit={submit}>
          <p className="caps small center" style={{ marginTop: 0 }}>Painel da loja</p>
          <div className="field"><label htmlFor="email">E-mail</label><input id="email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="field"><label htmlFor="password">Senha</label><input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          {error && <p className="alert alert-error">{error}</p>}
          <button className="btn btn-block" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</button>
        </form>
      </div>
    </div>
  );
}
