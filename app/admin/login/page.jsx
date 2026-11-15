'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminT, LangToggle } from '../i18n';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const router = useRouter();
  const { t } = useAdminT();

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    const r = await fetch('/api/admin/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: pw }),
    });
    setBusy(false);
    if (r.ok) { router.replace('/admin'); router.refresh(); return; }
    const j = await r.json().catch(() => ({}));
    setErr(t(j.error === 'not_staff' ? 'login.err.not_staff'
      : j.error === 'rate_limited' ? 'login.err.rate_limited' : 'login.err.invalid'));
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--ghg-ink)', display: 'grid', placeItems: 'center', padding: 20, position: 'relative' }}>
      <LangToggle style={{ position: 'absolute', top: 12, right: 16 }} />
      <form onSubmit={submit} style={{ width: '100%', maxWidth: 380 }} aria-labelledby="login-title">
        <h1 id="login-title" style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, letterSpacing: '0.12em', textAlign: 'center', color: 'var(--ghg-paper)', margin: 0 }}>
          ISAR FRISEUR <span style={{ color: 'var(--ghg-copper)' }}>· TEAM</span>
        </h1>
        <div style={{ marginTop: 28, display: 'grid', gap: 10 }}>
          <label className="sr-only" htmlFor="login-email">{t('common.email')}</label>
          <input id="login-email" type="email" autoComplete="username" autoFocus placeholder={t('common.email')}
            value={email} onChange={e => setEmail(e.target.value)} required />
          <label className="sr-only" htmlFor="login-pw">{t('common.password')}</label>
          <input id="login-pw" type="password" autoComplete="current-password" placeholder={t('common.password')}
            value={pw} onChange={e => setPw(e.target.value)} required />
          <div role="alert" aria-live="polite" style={{ color: '#ff8c66', fontSize: 13, minHeight: 18 }}>{err}</div>
          <button className="btn" disabled={busy}>{busy ? '…' : t('login.submit')}</button>
          <p style={{ fontSize: 12, color: 'var(--fg-3)', textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
            {t('login.forgot')}
          </p>
        </div>
      </form>
      <style>{`.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0}`}</style>
    </main>
  );
}
