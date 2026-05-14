'use client';
import { useRouter, usePathname } from 'next/navigation';

const TABS = [
  { href: '/admin', label: 'DASHBOARD' },
  { href: '/admin/bookings', label: 'BOOKINGS' },
  { href: '/admin/services', label: 'SERVICES' },
  { href: '/admin/stylists', label: 'STYLISTS' },
  { href: '/admin/hours', label: 'HOURS' },
  { href: '/admin/settings', label: 'SETTINGS' },
];

export default function AdminShell({ children }) {
  const router = useRouter();
  const path = usePathname();

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ghg-ink)', color: 'var(--ghg-paper)' }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'var(--ghg-ink)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 24, paddingTop: 16, paddingBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.12em' }}>
            ISAR FRISEUR <span style={{ color: 'var(--ghg-copper)' }}>· ADMIN</span>
          </div>
          <nav style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
            {TABS.map(t => {
              const active = path === t.href || (t.href !== '/admin' && path.startsWith(t.href));
              return (
                <a key={t.href} href={t.href} style={{
                  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                  letterSpacing: '0.16em',
                  color: active ? 'var(--ghg-copper)' : 'var(--ghg-paper)',
                  transition: 'color 200ms var(--e-brand)',
                }}>{t.label}</a>
              );
            })}
            <button onClick={logout} style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.3)',
              color: 'var(--ghg-paper)', padding: '6px 12px',
              fontSize: 11, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase',
            }}>Logout</button>
          </nav>
        </div>
      </header>
      <main className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>{children}</main>
    </div>
  );
}
