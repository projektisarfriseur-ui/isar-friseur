'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useAdminT, LangToggle } from './i18n';

export default function AdminShell({ me, children }) {
  const router = useRouter();
  const path = usePathname();
  const { t } = useAdminT();
  const tabs = [
    { href: '/admin', label: me?.user?.isAdmin ? t('shell.calendar') : t('shell.myCalendar') },
    ...(me?.user?.isOwner ? [{ href: '/admin/team', label: t('shell.team') }] : []),
  ];

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ghg-ink)', color: 'var(--ghg-paper)' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 30, background: 'var(--ghg-ink)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 20, paddingTop: 14, paddingBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: '0.12em' }}>
            ISAR FRISEUR <span style={{ color: 'var(--ghg-copper)' }}>· TEAM</span>
          </div>
          <nav aria-label={t('shell.nav')} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            {tabs.map(tab => {
              const active = tab.href === '/admin' ? path === '/admin' : path.startsWith(tab.href);
              return (
                <a key={tab.href} href={tab.href} aria-current={active ? 'page' : undefined} style={{
                  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, letterSpacing: '0.16em',
                  color: active ? 'var(--ghg-copper)' : 'var(--ghg-paper)', padding: '10px 0',
                }}>{tab.label}</a>
              );
            })}
            {me?.user && (
              <span style={{ fontSize: 12, color: 'var(--fg-2)' }}>
                {me.user.name}{me.user.isOwner ? ` · ${t('shell.boss')}` : ''}
              </span>
            )}
            <LangToggle />
            <button onClick={logout} style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'var(--ghg-paper)',
              padding: '10px 14px', minHeight: 44, fontSize: 11, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer',
            }}>{t('shell.logout')}</button>
          </nav>
        </div>
      </header>
      <main className="container" style={{ paddingTop: 32, paddingBottom: 80 }}>{children}</main>
    </div>
  );
}
