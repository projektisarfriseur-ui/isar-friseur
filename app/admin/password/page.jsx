'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminT, LangToggle } from '../i18n';

export default function SetPasswordPage() {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const router = useRouter();
  const { t } = useAdminT();

  async function submit(e) {
    e.preventDefault();
    if (pw.length < 10) { setErr(t('pw.err.short')); return; }
    if (pw !== pw2) { setErr(t('pw.err.mismatch')); return; }
    setBusy(true); setErr('');
    const r = await fetch('/api/admin/password', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    });
    setBusy(false);
    if (r.ok) { router.replace('/admin'); router.refresh(); return; }
    const j = await r.json().catch(() => ({}));
    setErr(t(j.error === 'unauthorized' ? 'pw.err.expired'
      : j.error === 'weak_password' ? 'pw.err.weak' : 'pw.err.failed'));
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--ghg-ink)', display: 'grid', placeItems: 'center', padding: 20, position: 'relative' }}>
      <LangToggle style={{ position: 'absolute', top: 12, right: 16 }} />
      <form onSubmit={submit} style={{ width: '100%', maxWidth: 380 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, letterSpacing: '0.08em', textAlign: 'center', color: 'var(--ghg-paper)', margin: 0 }}>
          {t('pw.title')}
        </h1>
        <p style={{ color: 'var(--fg-2)', fontSize: 14, textAlign: 'center', marginTop: 12 }}>
          {t('pw.intro')}
        </p>
        <div style={{ marginTop: 24, display: 'grid', gap: 10 }}>
          <label htmlFor="pw1" style={{ fontSize: 12, color: 'var(--fg-3)' }}>{t('pw.new')}</label>
          <input id="pw1" type="password" autoComplete="new-password" value={pw} onChange={e => setPw(e.target.value)} required />
          <label htmlFor="pw2" style={{ fontSize: 12, color: 'var(--fg-3)' }}>{t('pw.repeat')}</label>
          <input id="pw2" type="password" autoComplete="new-password" value={pw2} onChange={e => setPw2(e.target.value)} required />
          <div role="alert" aria-live="polite" style={{ color: '#ff8c66', fontSize: 13, minHeight: 18 }}>{err}</div>
          <button className="btn" disabled={busy}>{busy ? '…' : t('pw.submit')}</button>
        </div>
      </form>
    </main>
  );
}
