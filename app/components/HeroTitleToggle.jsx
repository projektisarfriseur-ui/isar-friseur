'use client';
import { useEffect, useState } from 'react';

const FONTS = [
  { id: 'default',          label: 'Default',           stack: "var(--font-cormorant), 'Cormorant Garamond', serif" },
  { id: 'sansation',        label: 'Sansation',         stack: "'Sansation', 'Inter', sans-serif" },
  { id: 'playfair',         label: 'Playfair Display',  stack: "'Playfair Display', Georgia, serif" },
  { id: 'dm-serif',         label: 'DM Serif Display',  stack: "'DM Serif Display', Georgia, serif" },
  { id: 'fraunces',         label: 'Fraunces',          stack: "'Fraunces', Georgia, serif" },
  { id: 'cormorant',        label: 'Cormorant Garamond',stack: "'Cormorant Garamond', Georgia, serif" },
  { id: 'marcellus',        label: 'Marcellus',         stack: "'Marcellus', Georgia, serif" },
  { id: 'bodoni',           label: 'Bodoni Moda',       stack: "'Bodoni Moda', Georgia, serif" },
  { id: 'crimson',          label: 'Crimson Pro',       stack: "'Crimson Pro', Georgia, serif" },
  { id: 'merriweather',     label: 'Merriweather',      stack: "'Merriweather', Georgia, serif" },
];

export default function HeroTitleToggle() {
  const [font, setFont] = useState('default');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('hero-title-font') : null;
    if (stored && FONTS.find(f => f.id === stored)) setFont(stored);
  }, []);

  useEffect(() => {
    const f = FONTS.find(x => x.id === font) || FONTS[0];
    document.documentElement.style.setProperty('--font-hero-title', f.stack);
    window.localStorage.setItem('hero-title-font', font);
  }, [font]);

  return (
    <div style={{ position: 'relative', display: 'inline-block', pointerEvents: 'auto' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(0,0,0,0.45)',
          border: '1px solid rgba(255,255,255,0.35)',
          color: '#ffffff',
          padding: '8px 14px',
          fontFamily: "var(--font-inter), 'Inter', sans-serif",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          backdropFilter: 'blur(6px)',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2"/>
          <line x1="12" y1="4" x2="12" y2="20"/>
          <line x1="9" y1="20" x2="15" y2="20"/>
        </svg>
        Title
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            aria-hidden="true"
          />
          <ul
            role="listbox"
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0,
              minWidth: 240, zIndex: 50,
              background: 'rgba(2,2,2,0.96)',
              border: '1px solid rgba(255,255,255,0.18)',
              boxShadow: '0 18px 50px rgba(0,0,0,0.6)',
              listStyle: 'none', padding: 6, margin: 0,
              backdropFilter: 'blur(8px)',
            }}
          >
            {FONTS.map((f) => {
              const active = f.id === font;
              return (
                <li key={f.id} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => { setFont(f.id); setOpen(false); }}
                    style={{
                      width: '100%', textAlign: 'left',
                      background: active ? 'var(--ghg-copper)' : 'transparent',
                      color: '#ffffff',
                      border: 0,
                      padding: '11px 14px',
                      fontFamily: f.stack,
                      fontSize: 19,
                      fontWeight: 400,
                      letterSpacing: '0.01em',
                      cursor: 'pointer',
                      transition: 'background 180ms ease',
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {f.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
