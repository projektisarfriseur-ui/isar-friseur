'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    const r = await fetch('/api/admin/login', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    });
    setBusy(false);
    if (r.ok) router.push('/admin'); else setErr('Falsches Passwort');
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--ghg-ink)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <form onSubmit={submit} style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '0.12em', textAlign: 'center', color: 'var(--ghg-paper)' }}>
          ISAR FRISEUR <span style={{ color: 'var(--ghg-copper)' }}>· ADMIN</span>
        </div>
        <div style={{ marginTop: 28, display: 'grid', gap: 10 }}>
          <input type="password" autoFocus placeholder="Passwort" value={pw} onChange={e => setPw(e.target.value)} required/>
          {err && <div style={{ color: '#ff8c66', fontSize: 13 }}>{err}</div>}
          <button className="btn" disabled={busy}>{busy ? '…' : 'LOGIN'}</button>
        </div>
      </form>
    </main>
  );
}
