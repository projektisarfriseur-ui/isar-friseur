'use client';
import { useState } from 'react';
import { useLang } from '../lib/i18n';
import LangToggle from './LangToggle';

const LINKS = [
  { id: 'about', key: 'nav.about' },
  { id: 'location', key: 'nav.location' },
  { id: 'services', key: 'nav.services' },
  { id: 'team', key: 'nav.team' },
  { id: 'contact', key: 'nav.contact' },
];

export default function Nav() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 30,
      background: 'rgba(2, 2, 2, 0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div className="container" style={{
        display: 'flex', alignItems: 'center', gap: 28,
        paddingTop: 14, paddingBottom: 14, minHeight: 64,
      }}>
        <a href="/#top" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 400, fontStyle: 'italic',
            fontSize: 28, letterSpacing: '0.01em',
            color: 'var(--fg)',
          }}>Isar Friseur</span>
        </a>
        <nav className="nav-links" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 28 }}>
          {LINKS.map(l => (
            <a key={l.id} href={`/${l.id}`} style={{
              fontFamily: 'var(--font-body)',
              fontSize: 12, fontWeight: 400,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--fg)',
              transition: 'color 300ms var(--e-brand)',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--ghg-copper)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--fg)'}
            >{t(l.key)}</a>
          ))}
          <LangToggle/>
          <a href="/booking" className="btn">{t('nav.cta')}</a>
        </nav>
        <button onClick={() => setOpen(!open)} className="nav-burger" aria-label="Menu" aria-expanded={open} aria-controls="mobile-menu" style={{
          display: 'none', background: 'transparent', border: 0,
          color: 'var(--fg)', marginLeft: 'auto',
          width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            {open ? (
              <>
                <line x1="5" y1="5" x2="19" y2="19"/>
                <line x1="19" y1="5" x2="5" y2="19"/>
              </>
            ) : (
              <>
                <line x1="3" y1="7" x2="21" y2="7"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="17" x2="21" y2="17"/>
              </>
            )}
          </svg>
        </button>
      </div>
      {open && (
        <div id="mobile-menu" style={{ background: 'var(--ghg-ink)', padding: '4px 20px 24px', borderTop: '1px solid var(--border)' }}>
          {LINKS.map(l => (
            <a key={l.id} href={`/${l.id}`} onClick={() => setOpen(false)} style={{
              display: 'flex', alignItems: 'center', minHeight: 56,
              fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 400,
              letterSpacing: '0.22em', color: 'var(--fg)', textTransform: 'uppercase',
              borderBottom: '1px solid var(--border)',
            }}>{t(l.key)}</a>
          ))}
          <div style={{ display: 'grid', gap: 16, marginTop: 20 }}>
            <div style={{ justifySelf: 'start' }}><LangToggle/></div>
            <a href="/booking" className="btn" style={{ textAlign: 'center' }}>{t('nav.cta')}</a>
          </div>
        </div>
      )}
      <style jsx>{`
        @media (max-width: 900px) {
          :global(.nav-links) { display: none !important; }
          :global(.nav-burger) { display: inline-flex !important; }
        }
      `}</style>
    </header>
  );
}
