'use client';
import { useLang } from '../lib/i18n';

export default function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div role="group" aria-label="Language" style={{
      display: 'inline-flex', alignItems: 'center',
      border: '1px solid rgba(255,255,255,0.25)',
      fontFamily: 'var(--font-body)',
    }}>
      {['de', 'en'].map((code) => {
        const active = lang === code;
        return (
          <button
            key={code}
            onClick={() => setLang(code)}
            aria-pressed={active}
            style={{
              background: active ? 'var(--ghg-copper)' : 'transparent',
              color: active ? 'var(--ghg-paper)' : 'rgba(255,255,255,0.7)',
              border: 0,
              padding: '6px 12px',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'background 300ms var(--e-brand), color 300ms var(--e-brand)',
            }}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
