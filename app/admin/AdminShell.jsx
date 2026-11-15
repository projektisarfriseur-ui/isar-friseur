'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAdminT, LangToggle } from './i18n';

export default function AdminShell({ me, children, wide = false }) {
  const router = useRouter();
  const path = usePathname();
  const { t } = useAdminT();
  // Header height as a CSS var so sticky content below it (calendar sidebar)
  // can pin exactly at its natural position and never shift on scroll.
  const headRef = useRef(null);
  const [headH, setHeadH] = useState(73);
  useEffect(() => {
    const el = headRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeadH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
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
    // zoom 0.9: at 100% browser zoom the admin looks like the owner's preferred 90% view.
    <div style={{ minHeight: 'calc(100vh / 0.9)', background: 'var(--ghg-ink)', color: 'var(--ghg-paper)', zoom: 0.9, '--admin-head': `${headH}px` }}>
      <header ref={headRef} style={{ position: 'sticky', top: 0, zIndex: 30, background: 'var(--ghg-ink)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
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
      <main className="container" style={{ paddingTop: 32, paddingBottom: 80, ...(wide ? { maxWidth: 'none', paddingLeft: 24, paddingRight: 24 } : {}) }}>{children}</main>
    </div>
  );
}
