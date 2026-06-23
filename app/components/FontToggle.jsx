'use client';
import { useEffect, useState } from 'react';

const FONTS = [
  {
    id: 'default',
    label: 'Default (Cormorant + Inter)',
    body: "var(--font-inter), 'Inter', system-ui, sans-serif",
    display: "var(--font-cormorant), 'Cormorant Garamond', serif",
  },
  {
    id: 'sansation',
    label: 'Sansation',
    body: "'Sansation', 'Inter', sans-serif",
    display: "'Sansation', 'Inter', sans-serif",
  },
  {
    id: 'merriweather',
    label: 'Merriweather',
    body: "'Merriweather', Georgia, serif",
    display: "'Merriweather', Georgia, serif",
  },
  {
    id: 'mozilla',
    label: 'Mozilla Text',
    body: "'Mozilla Text', Georgia, serif",
    display: "'Mozilla Text', Georgia, serif",
  },
  {
    id: 'noto-siyaq',
    label: 'Noto Serif Ottoman Siyaq',
    body: "'Noto Serif Ottoman Siyaq', serif",
    display: "'Noto Serif Ottoman Siyaq', serif",
  },
  {
    id: 'electrolize',
    label: 'Electrolize',
    body: "'Electrolize', sans-serif",
    display: "'Electrolize', sans-serif",
  },
  {
    id: 'anta',
    label: 'Anta',
    body: "'Anta', sans-serif",
    display: "'Anta', sans-serif",
  },
];

export default function FontToggle() {
  const [font, setFont] = useState('default');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('font') : null;
    if (stored && FONTS.find(f => f.id === stored)) setFont(stored);
  }, []);

  useEffect(() => {
    const f = FONTS.find(x => x.id === font) || FONTS[0];
    document.documentElement.style.setProperty('--font-body', f.body);
    window.localStorage.setItem('font', font);
  }, [font]);

  const current = FONTS.find(f => f.id === font) || FONTS[0];

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'transparent',
          border: '1px solid var(--border)',
          color: 'var(--fg)',
          padding: '6px 12px',
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="4 7 4 4 20 4 20 7"/>
          <line x1="9" y1="20" x2="15" y2="20"/>
          <line x1="12" y1="4" x2="12" y2="20"/>
        </svg>
        Font
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
              background: 'var(--ghg-ink)',
              border: '1px solid var(--border)',
              boxShadow: '0 18px 50px rgba(0,0,0,0.5)',
              listStyle: 'none', padding: 6, margin: 0,
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
                      color: active ? '#ffffff' : 'var(--fg)',
                      border: 0,
                      padding: '10px 14px',
                      fontFamily: f.display,
                      fontSize: 15,
                      fontWeight: 400,
                      letterSpacing: '0.02em',
                      cursor: 'pointer',
                      transition: 'background 180ms ease, color 180ms ease',
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
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
